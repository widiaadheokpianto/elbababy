import React from 'react';

interface ElbababyLogoProps {
  className?: string;
  height?: number;
}

export const ElbababyLogo: React.FC<ElbababyLogoProps> = ({ 
  className = "h-8 sm:h-9", 
  height 
}) => {
  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <svg
        viewBox="0 0 320 90"
        className="w-auto h-full max-h-10 transition-transform hover:scale-105 duration-200"
        style={height ? { height: `${height}px` } : undefined}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="elbababy logo"
      >
        <defs>
          <filter id="logo-sticker-shadow" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="3" floodColor="#000000" floodOpacity="0.12" />
          </filter>
        </defs>

        <g filter="url(#logo-sticker-shadow)">
          {/* Layer 1: Outer White Sticker Outline */}
          <text
            x="8"
            y="66"
            fontFamily="'Fredoka', 'Quicksand', 'Comfortaa', 'Arial Rounded MT Bold', sans-serif"
            fontSize="68"
            fontWeight="700"
            letterSpacing="-0.5px"
            stroke="#ffffff"
            strokeWidth="16"
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="#ffffff"
          >
            elbababy
          </text>

          {/* Layer 2: Soft Blue 'elba' (#7ea2ce) */}
          <text
            x="8"
            y="66"
            fontFamily="'Fredoka', 'Quicksand', 'Comfortaa', 'Arial Rounded MT Bold', sans-serif"
            fontSize="68"
            fontWeight="700"
            letterSpacing="-0.5px"
            fill="#7ea2ce"
            stroke="#7ea2ce"
            strokeWidth="2"
            strokeLinejoin="round"
          >
            elba
          </text>

          {/* Layer 3: Soft Pink 'baby' (#f28eb0) */}
          <text
            x="142"
            y="66"
            fontFamily="'Fredoka', 'Quicksand', 'Comfortaa', 'Arial Rounded MT Bold', sans-serif"
            fontSize="68"
            fontWeight="700"
            letterSpacing="-0.5px"
            fill="#f28eb0"
            stroke="#f28eb0"
            strokeWidth="2"
            strokeLinejoin="round"
          >
            baby
          </text>
        </g>
      </svg>
    </div>
  );
};

