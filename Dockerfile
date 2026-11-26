FROM node:24-bookworm-slim AS frontend
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY vite.config.js tsconfig.json ./
COPY frontend ./frontend
RUN npm run build

# Catalogue preparation is independent of the fitted ranker and UI. New model
# weights can be shipped without recomputing 42,994 transformer embeddings.
FROM python:3.12-slim AS index
ENV PYTHONUNBUFFERED=1 OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=2
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY intentrank/__init__.py intentrank/encoder.py intentrank/text.py intentrank/retrieval.py ./intentrank/
COPY scripts/download.py scripts/prepare.py ./scripts/
RUN python scripts/download.py && python scripts/prepare.py

FROM python:3.12-slim AS runtime
ENV PYTHONUNBUFFERED=1 OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=2 PORT=10000
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY intentrank ./intentrank
COPY scripts ./scripts
COPY artifacts ./artifacts
COPY --from=index /app/artifacts ./artifacts
COPY app.py ./
RUN python scripts/bootstrap.py --verify-only
COPY --from=frontend /build/public ./public
RUN useradd --create-home --uid 10001 appuser
USER appuser
EXPOSE 10000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:10000/api/health')"
CMD ["sh", "-c", "exec uvicorn app:app --host 0.0.0.0 --port ${PORT:-10000} --workers 1"]
