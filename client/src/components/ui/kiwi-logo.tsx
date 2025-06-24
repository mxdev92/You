interface KiwiLogoProps {
  size?: number;
  className?: string;
}

export function KiwiLogo({ size = 64, className = "" }: KiwiLogoProps) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer kiwi ring */}
        <circle 
          cx="50" 
          cy="50" 
          r="46" 
          fill="#7CB342" 
          stroke="#5A8A2B" 
          strokeWidth="2"
        />
        
        {/* White ring */}
        <circle 
          cx="50" 
          cy="50" 
          r="38" 
          fill="none" 
          stroke="white" 
          strokeWidth="3"
        />
        
        {/* Inner kiwi flesh */}
        <circle 
          cx="50" 
          cy="50" 
          r="32" 
          fill="#A4D65E"
        />
        
        {/* Center core */}
        <circle 
          cx="50" 
          cy="50" 
          r="8" 
          fill="#CDEC8B"
        />
        
        {/* Kiwi seeds */}
        <ellipse cx="50" cy="38" rx="1.5" ry="3" fill="#2E4A1F" />
        <ellipse cx="58" cy="42" rx="1.5" ry="3" fill="#2E4A1F" transform="rotate(36 58 42)" />
        <ellipse cx="62" cy="50" rx="1.5" ry="3" fill="#2E4A1F" transform="rotate(72 62 50)" />
        <ellipse cx="58" cy="58" rx="1.5" ry="3" fill="#2E4A1F" transform="rotate(108 58 58)" />
        <ellipse cx="50" cy="62" rx="1.5" ry="3" fill="#2E4A1F" transform="rotate(144 50 62)" />
        <ellipse cx="42" cy="58" rx="1.5" ry="3" fill="#2E4A1F" transform="rotate(180 42 58)" />
        <ellipse cx="38" cy="50" rx="1.5" ry="3" fill="#2E4A1F" transform="rotate(216 38 50)" />
        <ellipse cx="42" cy="42" rx="1.5" ry="3" fill="#2E4A1F" transform="rotate(252 42 42)" />
        
        {/* Leaf decoration */}
        <path 
          d="M20 25 Q15 20 10 25 Q12 30 18 28 Q22 26 20 25 Z" 
          fill="#5A8A2B"
        />
        <path 
          d="M16 23 Q20 18 25 22 Q23 27 17 25 Q13 23 16 23 Z" 
          fill="#7CB342"
        />
        
        {/* Leaf highlights */}
        <path 
          d="M12 24 Q16 22 18 26" 
          stroke="white" 
          strokeWidth="1" 
          fill="none" 
          opacity="0.6"
        />
        <path 
          d="M19 21 Q22 23 23 26" 
          stroke="white" 
          strokeWidth="1" 
          fill="none" 
          opacity="0.6"
        />
      </svg>
    </div>
  );
}