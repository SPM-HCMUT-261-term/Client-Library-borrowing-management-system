import React from 'react';

export interface BookCoverGraphicProps {
  title: string;
  author?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Renders the exact minimalist geometric book cover illustrations from the Figma design:
 * - The Midnight Library (Matt Haig)
 * - The Book Thief (Markus Zusak)
 * - The Hobbit (J.R.R. Tolkien)
 * - The House on Mango Street (Sandra Cisneros)
 * - A Wrinkle in Time (Madeleine L'Engle)
 * - The Giver (Lois Lowry)
 * - Wonder (R.J. Palacio)
 * - A Brief History of Time (Stephen Hawking)
 * Plus deterministic fallback covers for any additional catalog titles.
 */
export const BookCoverGraphic: React.FC<BookCoverGraphicProps> = ({
  title,
  author = '',
  size = 'md',
  className = '',
}) => {
  const normalized = title.toLowerCase().trim();

  const dimensions: Record<NonNullable<BookCoverGraphicProps['size']>, string> = {
    xs: 'w-[46px] h-[66px] rounded-[3px]',
    sm: 'w-[84px] h-[122px] rounded-[4px]',
    md: 'w-[126px] h-[182px] rounded-[5px]',
    lg: 'w-[228px] h-[330px] rounded-[6px]',
  };

  // 1. The Midnight Library
  if (normalized.includes('midnight library')) {
    return (
      <div
        className={`relative overflow-hidden select-none shadow-[0_8px_20px_rgba(23,46,76,0.22)] flex flex-col justify-between bg-[#172E4C] text-[#F1DEAD] ${dimensions[size]} ${className}`}
      >
        <svg viewBox="0 0 140 200" className="w-full h-full">
          <rect width="140" height="200" fill="#172E4C" />
          {/* Title */}
          <text
            x="70"
            y="30"
            textAnchor="middle"
            fill="#F1DEAD"
            fontFamily="Lora, Georgia, serif"
            fontWeight="600"
            fontSize="14.5"
          >
            <tspan x="70" dy="0">The</tspan>
            <tspan x="70" dy="17">Midnight</tspan>
            <tspan x="70" dy="17">Library</tspan>
          </text>

          {/* Crescent Moon */}
          <path
            d="M72 86 A 19 19 0 1 0 92 114 A 15 15 0 1 1 72 86 Z"
            fill="#F1DEAD"
          />

          {/* Bookshelf / Skyline Silhouette */}
          <g stroke="#F1DEAD" strokeWidth="1.1" fill="none" opacity="0.9">
            <rect x="20" y="142" width="16" height="22" />
            <rect x="36" y="135" width="14" height="29" />
            <polyline points="50,164 50,146 66,146 66,164" />
            <rect x="74" y="139" width="15" height="25" />
            <rect x="89" y="147" width="13" height="17" />
            <rect x="102" y="133" width="18" height="31" />
          </g>

          {/* Author */}
          <text
            x="70"
            y="182"
            textAnchor="middle"
            fill="#F1DEAD"
            fontFamily="Inter, sans-serif"
            fontWeight="600"
            fontSize="7"
            letterSpacing="0.8"
          >
            MATT HAIG
          </text>
        </svg>
      </div>
    );
  }

  // 2. The Book Thief
  if (normalized.includes('book thief')) {
    return (
      <div
        className={`relative overflow-hidden select-none shadow-[0_8px_20px_rgba(51,61,58,0.16)] bg-[#E7D9BD] text-[#333D3A] ${dimensions[size]} ${className}`}
      >
        <svg viewBox="0 0 140 200" className="w-full h-full">
          <rect width="140" height="200" fill="#E7D9BD" />
          <text
            x="70"
            y="34"
            textAnchor="middle"
            fill="#333D3A"
            fontFamily="Lora, Georgia, serif"
            fontWeight="600"
            fontSize="14.5"
          >
            <tspan x="70" dy="0">The Book</tspan>
            <tspan x="70" dy="18">Thief</tspan>
          </text>

          {/* Botanical leaf line art */}
          <g stroke="#333D3A" strokeWidth="1.35" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M40 145 Q 68 118 98 86" />
            <path d="M58 128 C 46 114, 48 96, 62 104 C 66 108, 63 120, 58 128 Z" />
            <path d="M74 112 C 88 108, 98 118, 86 126 C 78 130, 75 120, 74 112 Z" />
            <path d="M79 105 C 72 92, 80 82, 90 88 C 94 92, 86 101, 79 105 Z" />
          </g>

          <text
            x="70"
            y="182"
            textAnchor="middle"
            fill="#333D3A"
            fontFamily="Inter, sans-serif"
            fontWeight="600"
            fontSize="6.8"
            letterSpacing="0.7"
          >
            MARKUS ZUSAK
          </text>
        </svg>
      </div>
    );
  }

  // 3. The Hobbit or A Brief History of Time
  if (normalized.includes('hobbit') || normalized.includes('brief history')) {
    const isHobbit = normalized.includes('hobbit');
    return (
      <div
        className={`relative overflow-hidden select-none shadow-[0_8px_20px_rgba(36,88,76,0.20)] bg-[#24584C] text-[#E8D6A4] ${dimensions[size]} ${className}`}
      >
        <svg viewBox="0 0 140 200" className="w-full h-full">
          <rect width="140" height="200" fill="#24584C" />
          {isHobbit ? (
            <text
              x="70"
              y="36"
              textAnchor="middle"
              fill="#E8D6A4"
              fontFamily="Lora, Georgia, serif"
              fontWeight="600"
              fontSize="15"
            >
              The Hobbit
            </text>
          ) : (
            <text
              x="70"
              y="30"
              textAnchor="middle"
              fill="#E8D6A4"
              fontFamily="Lora, Georgia, serif"
              fontWeight="600"
              fontSize="12.5"
            >
              <tspan x="70" dy="0">A Brief</tspan>
              <tspan x="70" dy="15">History of</tspan>
              <tspan x="70" dy="15">Time</tspan>
            </text>
          )}

          {/* Twin mountain peaks */}
          <polygon points="18,154 52,102 84,154" fill="#E8D6A4" />
          <polygon points="56,154 88,92 122,154" fill="#E8D6A4" />

          <text
            x="70"
            y="182"
            textAnchor="middle"
            fill="#E8D6A4"
            fontFamily="Inter, sans-serif"
            fontWeight="600"
            fontSize="6.8"
            letterSpacing="0.7"
          >
            {isHobbit ? 'J.R.R. TOLKIEN' : 'STEPHEN HAWKING'}
          </text>
        </svg>
      </div>
    );
  }

  // 4. The House on Mango Street or Wonder
  if (normalized.includes('mango street') || normalized === 'wonder') {
    const isMango = normalized.includes('mango street');
    return (
      <div
        className={`relative overflow-hidden select-none shadow-[0_8px_20px_rgba(188,87,61,0.20)] bg-[#BC573D] text-[#FFF0CC] ${dimensions[size]} ${className}`}
      >
        <svg viewBox="0 0 140 200" className="w-full h-full">
          <rect width="140" height="200" fill="#BC573D" />
          {isMango ? (
            <text
              x="70"
              y="30"
              textAnchor="middle"
              fill="#FFF0CC"
              fontFamily="Lora, Georgia, serif"
              fontWeight="600"
              fontSize="13.5"
            >
              <tspan x="70" dy="0">The House</tspan>
              <tspan x="70" dy="16">on Mango</tspan>
              <tspan x="70" dy="16">Street</tspan>
            </text>
          ) : (
            <text
              x="70"
              y="40"
              textAnchor="middle"
              fill="#FFF0CC"
              fontFamily="Lora, Georgia, serif"
              fontWeight="600"
              fontSize="16"
            >
              Wonder
            </text>
          )}

          {/* Windows & Doorway motif */}
          <g stroke="#FFF0CC" strokeWidth="1.4" fill="none">
            <rect x="53" y="122" width="5" height="5" />
            <rect x="82" y="122" width="5" height="5" />
            <rect x="63" y="133" width="14" height="24" />
          </g>

          <text
            x="70"
            y="182"
            textAnchor="middle"
            fill="#FFF0CC"
            fontFamily="Inter, sans-serif"
            fontWeight="600"
            fontSize="6.5"
            letterSpacing="0.7"
          >
            {isMango ? 'SANDRA CISNEROS' : 'R.J. PALACIO'}
          </text>
        </svg>
      </div>
    );
  }

  // 5. A Wrinkle in Time
  if (normalized.includes('wrinkle in time')) {
    return (
      <div
        className={`relative overflow-hidden select-none shadow-[0_8px_20px_rgba(62,54,91,0.16)] bg-[#DCD6EB] text-[#3E365B] ${dimensions[size]} ${className}`}
      >
        <svg viewBox="0 0 140 200" className="w-full h-full">
          <rect width="140" height="200" fill="#DCD6EB" />
          <text
            x="70"
            y="34"
            textAnchor="middle"
            fill="#3E365B"
            fontFamily="Lora, Georgia, serif"
            fontWeight="600"
            fontSize="14.5"
          >
            <tspan x="70" dy="0">A Wrinkle</tspan>
            <tspan x="70" dy="18">in Time</tspan>
          </text>

          {/* Orbital ellipse & planet */}
          <g transform="translate(70, 118)">
            <ellipse
              cx="0"
              cy="0"
              rx="34"
              ry="20"
              transform="rotate(-14)"
              fill="none"
              stroke="#3E365B"
              strokeWidth="1.3"
            />
            <circle cx="0" cy="0" r="12" fill="#3E365B" />
            <circle cx="29" cy="-14" r="3" fill="#3E365B" />
          </g>

          <text
            x="70"
            y="182"
            textAnchor="middle"
            fill="#3E365B"
            fontFamily="Inter, sans-serif"
            fontWeight="600"
            fontSize="6.4"
            letterSpacing="0.6"
          >
            MADELEINE L&apos;ENGLE
          </text>
        </svg>
      </div>
    );
  }

  // 6. The Giver
  if (normalized.includes('the giver') || normalized === 'giver') {
    return (
      <div
        className={`relative overflow-hidden select-none shadow-[0_8px_20px_rgba(35,62,69,0.18)] bg-[#ADBFBE] text-[#233E45] ${dimensions[size]} ${className}`}
      >
        <svg viewBox="0 0 140 200" className="w-full h-full">
          <rect width="140" height="200" fill="#ADBFBE" />
          <text
            x="70"
            y="36"
            textAnchor="middle"
            fill="#233E45"
            fontFamily="Lora, Georgia, serif"
            fontWeight="600"
            fontSize="15"
          >
            The Giver
          </text>

          {/* Sun / Memory sphere & horizon */}
          <circle cx="70" cy="112" r="24" fill="#233E45" />
          <line x1="44" y1="128" x2="96" y2="128" stroke="#ADBFBE" strokeWidth="2.2" />
          <line x1="48" y1="142" x2="92" y2="142" stroke="#233E45" strokeWidth="1.4" />

          <text
            x="70"
            y="182"
            textAnchor="middle"
            fill="#233E45"
            fontFamily="Inter, sans-serif"
            fontWeight="600"
            fontSize="6.8"
            letterSpacing="0.8"
          >
            LOIS LOWRY
          </text>
        </svg>
      </div>
    );
  }

  // Fallback minimalist cover for additional titles
  return (
    <div
      className={`relative overflow-hidden select-none shadow-[0_8px_20px_rgba(23,100,95,0.18)] bg-[#17645F] text-[#F4EDDE] p-3 flex flex-col justify-between items-center text-center ${dimensions[size]} ${className}`}
    >
      <div className="font-serif font-semibold text-xs leading-snug line-clamp-3 mt-1">
        {title}
      </div>
      <div className="w-8 h-8 rounded-full border border-[#F4EDDE]/60 flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-[#F4EDDE]" />
      </div>
      <div className="font-sans font-semibold text-[8px] tracking-wider uppercase opacity-90 truncate max-w-full">
        {author}
      </div>
    </div>
  );
};
