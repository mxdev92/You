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
        {/* Modern circular background */}
        <circle 
          cx="50" 
          cy="50" 
          r="48" 
          fill="url(#modernGradient)"
        />
        
        {/* Stylized Q letter */}
        <path 
          d="M35 35 Q35 25 45 25 L55 25 Q65 25 65 35 L65 55 Q65 65 55 65 L50 65 Q60 65 70 75"
          stroke="white" 
          strokeWidth="6" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Modern dot accent */}
        <circle 
          cx="62" 
          cy="68" 
          r="3" 
          fill="white"
        />
        
        {/* Subtle leaf accent */}
        <path 
          d="M72 28 Q78 25 82 30 Q80 35 75 33 Q70 30 72 28 Z" 
          fill="rgba(255,255,255,0.3)"
        />
        
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="modernGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}