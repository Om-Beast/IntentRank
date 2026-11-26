"""Shared, deliberately small text and attribute rules used at train and serve time."""
from __future__ import annotations

import re
import unicodedata

STOP_WORDS = frozenset('a an the of for with and or in on to by is it that this'.split())
ATTRIBUTE_GROUPS = {
    'color': 'black white blue red green pink grey gray brown beige gold silver yellow orange purple turquoise teal navy ivory cream'.split(),
    'material': 'wood wooden metal glass leather velvet fabric plastic marble oak bamboo acrylic rattan steel walnut'.split(),
    'style': 'modern contemporary rustic vintage industrial traditional farmhouse bohemian minimalist'.split(),
    'size': 'small large twin queen king full narrow round square'.split(),
    'setting': 'outdoor indoor bathroom bedroom kitchen office living dining patio'.split(),
}
ALIASES = {'grey': 'gray', 'wooden': 'wood', 'blk': 'black'}


def normalize(text: str) -> str:
    """Normalize typography without dropping colors, dimensions, or negation."""
    text = unicodedata.normalize('NFKC', str(text)).casefold()
    return re.sub(r'\s+', ' ', text).strip()


def tokens(text: str) -> list[str]:
    words = re.findall(r'[a-z0-9]+', normalize(text))
    words = [ALIASES.get(w, w) for w in words if w not in STOP_WORDS]
    return [w[:-1] if len(w) > 4 and w.endswith('s') and not w.endswith('ss') else w for w in words]


def attributes(text: str) -> dict[str, list[str]]:
    words = set(tokens(text))
    return {kind: sorted(words.intersection(tokens(' '.join(values))))
            for kind, values in ATTRIBUTE_GROUPS.items()
            if words.intersection(tokens(' '.join(values)))}
