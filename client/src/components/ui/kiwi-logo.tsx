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
        {/* Outer brown fuzzy skin */}
        <circle 
          cx="50" 
          cy="50" 
          r="47" 
          fill="#8B4513"
          stroke="#654321"
          strokeWidth="1"
        />
        
        {/* Inner white ring */}
        <circle 
          cx="50" 
          cy="50" 
          r="40" 
          fill="none" 
          stroke="#F5F5DC"
          strokeWidth="2.5"
        />
        
        {/* Green flesh */}
        <circle 
          cx="50" 
          cy="50" 
          r="35" 
          fill="#9ACD32"
        />
        
        {/* Lighter inner flesh */}
        <circle 
          cx="50" 
          cy="50" 
          r="28" 
          fill="#ADFF2F"
        />
        
        {/* Center white core */}
        <circle 
          cx="50" 
          cy="50" 
          r="8" 
          fill="#F0F8E8"
        />
        
        {/* Black seeds arranged in circle */}
        <circle cx="50" cy="35" r="1.5" fill="#2F4F2F" />
        <circle cx="58" cy="38" r="1.5" fill="#2F4F2F" />
        <circle cx="63" cy="45" r="1.5" fill="#2F4F2F" />
        <circle cx="65" cy="53" r="1.5" fill="#2F4F2F" />
        <circle cx="62" cy="61" r="1.5" fill="#2F4F2F" />
        <circle cx="55" cy="67" r="1.5" fill="#2F4F2F" />
        <circle cx="47" cy="68" r="1.5" fill="#2F4F2F" />
        <circle cx="39" cy="65" r="1.5" fill="#2F4F2F" />
        <circle cx="33" cy="58" r="1.5" fill="#2F4F2F" />
        <circle cx="30" cy="50" r="1.5" fill="#2F4F2F" />
        <circle cx="32" cy="42" r="1.5" fill="#2F4F2F" />
        <circle cx="38" cy="36" r="1.5" fill="#2F4F2F" />
        
        {/* Small brown spots on skin for texture */}
        <circle cx="25" cy="30" r="1" fill="#654321" opacity="0.7" />
        <circle cx="35" cy="25" r="0.8" fill="#654321" opacity="0.6" />
        <circle cx="65" cy="35" r="1" fill="#654321" opacity="0.7" />
        <circle cx="75" cy="55" r="0.8" fill="#654321" opacity="0.6" />
        <circle cx="70" cy="70" r="1" fill="#654321" opacity="0.7" />
        <circle cx="30" cy="75" r="0.8" fill="#654321" opacity="0.6" />
        
        {/* Subtle highlight on flesh */}
        <ellipse 
          cx="42" 
          cy="42" 
          rx="8" 
          ry="12" 
          fill="rgba(255,255,255,0.2)"
          transform="rotate(-30 42 42)"
        />
      </svg>
    </div>
  );
}