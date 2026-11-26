export function Furniture({ category }: { category: string }) {
  const text = category.toLowerCase();
  const type = /chair|recliner|stool/.test(text)
    ? 'chair'
    : /sofa|sectional|loveseat/.test(text)
      ? 'sofa'
      : /bed|mattress/.test(text)
        ? 'bed'
        : /mirror|wall|art|clock/.test(text)
          ? 'wall'
          : /light|lamp|chandelier/.test(text)
            ? 'lamp'
            : /rug|mat|carpet|pillow|cushion/.test(text)
              ? 'soft'
              : 'table';
  return (
    <div
      className={`furniture ${type}`}
      aria-label="Category illustration, not a product photograph"
    >
      <svg viewBox="0 0 200 140" aria-hidden="true">
        <ellipse cx="100" cy="123" rx="60" ry="7" fill="#a4a491" opacity=".15" />
        {type === 'sofa' ? (
          <>
            <path d="M53 53Q53 43 64 43H139Q150 43 150 54V97H53Z" fill="#899b80" />
            <path d="M60 55H98V89H60ZM103 55H143V89H103Z" fill="#a9b79f" />
            <rect x="43" y="78" width="116" height="30" rx="8" fill="#a2b397" />
            <rect x="41" y="69" width="15" height="37" rx="6" fill="#71866a" />
            <rect x="148" y="69" width="15" height="37" rx="6" fill="#71866a" />
            <path d="M55 107V121M148 107V121" stroke="#5c4939" strokeWidth="5" />
          </>
        ) : type === 'chair' ? (
          <>
            <path d="M73 35Q99 23 125 36L119 82H79Z" fill="#bfa17e" />
            <path d="M76 50Q99 42 122 51" stroke="#d6bea0" strokeWidth="2" />
            <path d="M69 80Q99 69 133 82L128 96H73Z" fill="#b38e64" />
            <path
              d="M77 95L68 122M125 95L134 122M82 95L86 116M120 95L115 116"
              stroke="#694f37"
              strokeWidth="4"
            />
          </>
        ) : type === 'bed' ? (
          <>
            <path d="M53 46H147V91H53Z" fill="#ac957b" />
            <path d="M47 78L150 72L167 107H36Z" fill="#e5ddc9" />
            <path d="M48 91L157 87L167 108H36Z" fill="#a2b2a0" />
            <path d="M47 107V121M156 107V121" stroke="#745d46" strokeWidth="5" />
            <path d="M64 61L94 59L98 75H59ZM105 58L135 57L141 73H103Z" fill="#f6f2e6" />
          </>
        ) : type === 'lamp' ? (
          <>
            <path d="M81 24H119L139 70H62Z" fill="#d4bf99" />
            <path d="M100 70V116" stroke="#77614b" strokeWidth="5" />
            <ellipse cx="100" cy="117" rx="27" ry="5" fill="#8d7558" />
            <path d="M82 30L74 63M116 30L126 63" stroke="#e6d6b7" strokeWidth="2" />
          </>
        ) : type === 'wall' ? (
          <>
            <rect x="58" y="20" width="85" height="99" rx="42" fill="#ac8f6b" />
            <rect x="65" y="27" width="71" height="85" rx="35" fill="#d4ded6" />
            <path d="M72 92L122 35" stroke="#f0f1e7" strokeWidth="14" opacity=".65" />
          </>
        ) : type === 'soft' ? (
          <>
            <path
              d="M61 35Q97 43 137 34Q129 77 141 112Q97 105 58 112Q69 76 61 35Z"
              fill="#719b99"
            />
            <path
              d="M70 46Q99 52 127 44Q121 76 130 102Q99 97 69 102Q77 76 70 46Z"
              fill="none"
              stroke="#afc4b5"
            />
            <path d="M76 48L124 99M97 47L129 81M70 67L105 101" stroke="#b1c6b6" opacity=".35" />
          </>
        ) : (
          <>
            <path d="M47 72L118 49L163 68L90 95Z" fill="#bda182" />
            <path d="M47 72V80L90 102V95ZM90 95L163 68V76L90 102Z" fill="#a58765" />
            <path d="M57 83V118M151 82V115M93 101V128M116 63V92" stroke="#6e543a" strokeWidth="5" />
          </>
        )}
      </svg>
      <span>category study</span>
    </div>
  );
}
