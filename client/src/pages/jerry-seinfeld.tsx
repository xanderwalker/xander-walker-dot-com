import { Link } from 'wouter';
import { useState, useEffect } from 'react';

export default function JerrySeinfeld() {
  const [leftArmAngle, setLeftArmAngle] = useState(0);
  const [rightArmAngle, setRightArmAngle] = useState(0);
  const [leftLegAngle, setLeftLegAngle] = useState(0);
  const [rightLegAngle, setRightLegAngle] = useState(0);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, angle: 0 });

  const handleMouseDown = (limb: string, e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(limb);
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    setDragStart({
      x: e.clientX - centerX,
      y: e.clientY - centerY,
      angle: getCurrentAngle(limb)
    });
  };

  const getCurrentAngle = (limb: string) => {
    switch (limb) {
      case 'leftArm': return leftArmAngle;
      case 'rightArm': return rightArmAngle;
      case 'leftLeg': return leftLegAngle;
      case 'rightLeg': return rightLegAngle;
      default: return 0;
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const rect = document.querySelector(`[data-limb="${isDragging}"]`)?.getBoundingClientRect();
    if (!rect) return;
    
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    
    switch (isDragging) {
      case 'leftArm':
        setLeftArmAngle(Math.max(-120, Math.min(120, angle)));
        break;
      case 'rightArm':
        setRightArmAngle(Math.max(-120, Math.min(120, angle)));
        break;
      case 'leftLeg':
        setLeftLegAngle(Math.max(-45, Math.min(45, angle)));
        break;
      case 'rightLeg':
        setRightLegAngle(Math.max(-45, Math.min(45, angle)));
        break;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  // Add event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-yellow-50 relative overflow-hidden">
      
      {/* Title */}
      <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-20">
        <Link href="/">
          <h1 className="font-xanman-wide text-3xl md:text-4xl text-black glassmorphism px-8 py-4 rounded-lg hover:bg-white/30 transition-all duration-300 cursor-pointer">
            XANDER WALKER
          </h1>
        </Link>
      </div>

      {/* Navigation */}
      <div className="fixed top-8 left-8 z-20">
        <Link href="/projects">
          <button className="glassmorphism px-6 py-3 rounded-lg text-black font-xanman-wide hover:bg-white/30 transition-all duration-300">
            PROJECTS
          </button>
        </Link>
      </div>

      {/* Instructions */}
      <div className="fixed top-8 right-8 z-20">
        <div className="glassmorphism px-6 py-3 rounded-lg text-black font-xanman-wide">
          DRAG TO MOVE LIMBS
        </div>
      </div>

      {/* Jerry Seinfeld Cartoon */}
      <div className="flex items-center justify-center min-h-screen">
        <svg
          width="400"
          height="600"
          viewBox="0 0 400 600"
          className="drop-shadow-lg"
        >
          {/* Body */}
          <ellipse cx="200" cy="350" rx="60" ry="100" fill="#4A90E2" stroke="#2C5AA0" strokeWidth="3" />
          
          {/* Head */}
          <circle cx="200" cy="180" r="70" fill="#FFE5B4" stroke="#D4A574" strokeWidth="3" />
          
          {/* Hair */}
          <path d="M 140 140 Q 200 100 260 140 Q 250 120 200 115 Q 150 120 140 140" fill="#8B4513" stroke="#654321" strokeWidth="2" />
          
          {/* Eyes */}
          <ellipse cx="180" cy="165" rx="8" ry="12" fill="white" />
          <ellipse cx="220" cy="165" rx="8" ry="12" fill="white" />
          <circle cx="180" cy="167" r="4" fill="black" />
          <circle cx="220" cy="167" r="4" fill="black" />
          
          {/* Eyebrows */}
          <path d="M 170 150 Q 180 145 190 150" stroke="#8B4513" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 210 150 Q 220 145 230 150" stroke="#8B4513" strokeWidth="3" fill="none" strokeLinecap="round" />
          
          {/* Nose */}
          <ellipse cx="200" cy="180" rx="6" ry="10" fill="#FFD1A4" stroke="#D4A574" strokeWidth="1" />
          
          {/* Mouth */}
          <path d="M 185 200 Q 200 210 215 200" stroke="#8B0000" strokeWidth="3" fill="none" strokeLinecap="round" />
          
          {/* Neck */}
          <rect x="185" y="245" width="30" height="25" fill="#FFE5B4" stroke="#D4A574" strokeWidth="2" />
          
          {/* Left Arm */}
          <g 
            data-limb="leftArm"
            style={{ 
              transformOrigin: '140px 320px',
              transform: `rotate(${leftArmAngle}deg)`,
              cursor: isDragging === 'leftArm' ? 'grabbing' : 'grab'
            }}
            onMouseDown={(e) => handleMouseDown('leftArm', e)}
          >
            <rect x="100" y="315" width="50" height="15" fill="#FFE5B4" stroke="#D4A574" strokeWidth="2" rx="7" />
            <circle cx="95" cy="322" r="12" fill="#FFE5B4" stroke="#D4A574" strokeWidth="2" />
          </g>
          
          {/* Right Arm */}
          <g 
            data-limb="rightArm"
            style={{ 
              transformOrigin: '260px 320px',
              transform: `rotate(${rightArmAngle}deg)`,
              cursor: isDragging === 'rightArm' ? 'grabbing' : 'grab'
            }}
            onMouseDown={(e) => handleMouseDown('rightArm', e)}
          >
            <rect x="250" y="315" width="50" height="15" fill="#FFE5B4" stroke="#D4A574" strokeWidth="2" rx="7" />
            <circle cx="305" cy="322" r="12" fill="#FFE5B4" stroke="#D4A574" strokeWidth="2" />
          </g>
          
          {/* Pants */}
          <ellipse cx="200" cy="430" rx="65" ry="60" fill="#2C3E50" stroke="#1A252F" strokeWidth="3" />
          
          {/* Left Leg */}
          <g 
            data-limb="leftLeg"
            style={{ 
              transformOrigin: '170px 480px',
              transform: `rotate(${leftLegAngle}deg)`,
              cursor: isDragging === 'leftLeg' ? 'grabbing' : 'grab'
            }}
            onMouseDown={(e) => handleMouseDown('leftLeg', e)}
          >
            <rect x="160" y="475" width="20" height="80" fill="#2C3E50" stroke="#1A252F" strokeWidth="2" rx="10" />
            <ellipse cx="170" cy="565" rx="18" ry="10" fill="#000000" stroke="#333333" strokeWidth="2" />
          </g>
          
          {/* Right Leg */}
          <g 
            data-limb="rightLeg"
            style={{ 
              transformOrigin: '230px 480px',
              transform: `rotate(${rightLegAngle}deg)`,
              cursor: isDragging === 'rightLeg' ? 'grabbing' : 'grab'
            }}
            onMouseDown={(e) => handleMouseDown('rightLeg', e)}
          >
            <rect x="220" y="475" width="20" height="80" fill="#2C3E50" stroke="#1A252F" strokeWidth="2" rx="10" />
            <ellipse cx="230" cy="565" rx="18" ry="10" fill="#000000" stroke="#333333" strokeWidth="2" />
          </g>
          
          {/* Speech Bubble */}
          <g>
            <ellipse cx="320" cy="120" rx="60" ry="30" fill="white" stroke="#CCCCCC" strokeWidth="2" />
            <path d="M 280 135 L 250 160 L 290 145 Z" fill="white" stroke="#CCCCCC" strokeWidth="2" />
            <text x="320" y="125" textAnchor="middle" fontSize="14" fill="black" fontFamily="Georgia, serif">
              What's the deal?
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}