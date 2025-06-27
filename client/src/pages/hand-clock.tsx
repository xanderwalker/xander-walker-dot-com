import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';

export default function HandClock() {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Paint swirling state
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [deviceMotion, setDeviceMotion] = useState({ x: 0, y: 0, z: 0 });
  const backgroundRef = useRef<HTMLDivElement>(null);

  // Mouse movement for paint swirling (desktop)
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth) * 100;
      const y = (event.clientY / window.innerHeight) * 100;
      setMousePosition({ x, y });
      
      // Update CSS custom properties for paint swirling
      if (backgroundRef.current) {
        backgroundRef.current.style.setProperty('--mouse-x', `${x}%`);
        backgroundRef.current.style.setProperty('--mouse-y', `${y}%`);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Device motion for paint swirling (mobile)
  useEffect(() => {
    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      if (event.accelerationIncludingGravity) {
        const x = Math.max(-50, Math.min(50, (event.accelerationIncludingGravity.x || 0) * 5));
        const y = Math.max(-50, Math.min(50, (event.accelerationIncludingGravity.y || 0) * 5));
        const z = Math.max(-50, Math.min(50, (event.accelerationIncludingGravity.z || 0) * 5));
        
        setDeviceMotion({ x, y, z });
        
        // Update CSS custom properties for paint swirling
        if (backgroundRef.current) {
          backgroundRef.current.style.setProperty('--tilt-x', `${x + 50}%`);
          backgroundRef.current.style.setProperty('--tilt-y', `${y + 50}%`);
          backgroundRef.current.style.setProperty('--tilt-z', `${z + 50}%`);
        }
      }
    };

    // Request permission for device motion on iOS
    if (typeof DeviceMotionEvent !== 'undefined' && typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      (DeviceMotionEvent as any).requestPermission().then((response: string) => {
        if (response === 'granted') {
          window.addEventListener('devicemotion', handleDeviceMotion);
        }
      });
    } else {
      window.addEventListener('devicemotion', handleDeviceMotion);
    }

    return () => window.removeEventListener('devicemotion', handleDeviceMotion);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const AmoebaWithHandsClockComponent = ({ currentTime }: { currentTime: Date }) => {
    const [pulseScale, setPulseScale] = useState(1);
    const seconds = currentTime.getSeconds();
    const minutes = currentTime.getMinutes();
    const hours = currentTime.getHours() % 12;
    
    // Create pulsing effect based on seconds
    useEffect(() => {
      const interval = setInterval(() => {
        setPulseScale(1 + Math.sin(Date.now() / 200) * 0.03);
      }, 50);
      
      return () => clearInterval(interval);
    }, []);

    return (
      <div className="relative w-80 h-80 flex items-center justify-center">
        <svg width="300" height="300" viewBox="0 0 300 300" className="absolute inset-0">
          {/* Enhanced gooey filter for hands */}
          <defs>
            <filter id="gooeyHands">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
              <feColorMatrix in="blur" mode="matrix" values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 25 -12" result="gooey" />
              <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
            </filter>
          </defs>
          
          {/* Main amoeba body */}
          <ellipse
            cx="150"
            cy="150"
            rx={85 + Math.sin(seconds * 0.1) * 8}
            ry={75 + Math.cos(seconds * 0.12) * 6}
            fill="rgba(59, 130, 246, 0.7)"
            filter="url(#gooeyHands)"
            style={{
              transform: `rotate(${seconds * 2}deg) scale(${pulseScale})`,
              transformOrigin: 'center',
              transition: 'transform 0.1s ease-out'
            }}
          />
          
          {/* Hour hand - thick and organic */}
          <line
            x1="150"
            y1="150"
            x2={150 + Math.cos((hours * 30 - 90) * Math.PI / 180) * 50}
            y2={150 + Math.sin((hours * 30 - 90) * Math.PI / 180) * 50}
            stroke="rgba(255, 255, 255, 0.9)"
            strokeWidth="12"
            strokeLinecap="round"
            filter="url(#gooeyHands)"
            style={{
              transform: `scale(${pulseScale})`,
              transformOrigin: 'center'
            }}
          />
          
          {/* Minute hand - medium thickness */}
          <line
            x1="150"
            y1="150"
            x2={150 + Math.cos((minutes * 6 - 90) * Math.PI / 180) * 70}
            y2={150 + Math.sin((minutes * 6 - 90) * Math.PI / 180) * 70}
            stroke="rgba(255, 255, 255, 0.85)"
            strokeWidth="8"
            strokeLinecap="round"
            filter="url(#gooeyHands)"
            style={{
              transform: `scale(${pulseScale})`,
              transformOrigin: 'center'
            }}
          />
          
          {/* Second hand - thin and precise */}
          <line
            x1="150"
            y1="150"
            x2={150 + Math.cos((seconds * 6 - 90) * Math.PI / 180) * 85}
            y2={150 + Math.sin((seconds * 6 - 90) * Math.PI / 180) * 85}
            stroke="rgba(255, 100, 100, 0.9)"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#gooeyHands)"
          />
          
          {/* Center hub */}
          <circle
            cx="150"
            cy="150"
            r="8"
            fill="rgba(255, 255, 255, 0.8)"
            filter="url(#gooeyHands)"
          />
          
          {/* Glossy highlight */}
          <ellipse
            cx="130"
            cy="120"
            rx="25"
            ry="35"
            fill="rgba(255, 255, 255, 0.3)"
            style={{
              transform: `scale(${pulseScale * 0.9})`,
              transformOrigin: 'center',
              transition: 'transform 0.1s ease-out'
            }}
          />
        </svg>
        
        {/* Digital time display below */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center">
          <div className="font-serif text-white text-lg drop-shadow-lg bg-black bg-opacity-30 px-3 py-1 rounded-lg" style={{fontFamily: 'Georgia, serif'}}>
            {String(currentTime.getHours()).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Interactive paint swirling background */}
      <div 
        ref={backgroundRef}
        className="fixed inset-0 paint-swirl-bg -z-10" 
        style={{
          '--mouse-x': '50%',
          '--mouse-y': '50%',
          '--tilt-x': '50%',
          '--tilt-y': '50%',
          '--tilt-z': '50%'
        } as React.CSSProperties}
      />
      
      {/* Header with navigation */}
      <header className="p-8 flex justify-between items-center relative z-10">
        <Link href="/projects/clock">
          <button className="text-white hover:text-gray-200 transition-colors text-lg backdrop-blur-sm bg-black/20 px-4 py-2 rounded-lg border border-white/20">
            ← BACK TO CLOCKS
          </button>
        </Link>
        
        <Link href="/">
          <h1 className="text-white font-xanman-wide font-bold text-4xl md:text-6xl hover:opacity-70 transition-opacity duration-200 cursor-pointer drop-shadow-lg">
            XANDER WALKER
          </h1>
        </Link>
        
        <div className="w-48"></div> {/* Spacer for center alignment */}
      </header>

      {/* Hand Clock Display */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="glassmorphism rounded-2xl p-8">
          <h2 className="font-serif text-2xl mb-8 text-center text-white" style={{fontFamily: 'Georgia, serif'}}>
            HAND CLOCK
          </h2>
          <AmoebaWithHandsClockComponent currentTime={currentTime} />
        </div>
      </div>
    </div>
  );
}