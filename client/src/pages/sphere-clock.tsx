import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';

export default function SphereClock() {
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

  const AmoebaClockComponent = ({ currentTime }: { currentTime: Date }) => {
    const [pulseScale, setPulseScale] = useState(1);
    const seconds = currentTime.getSeconds();
    const minutes = currentTime.getMinutes();
    const hours = currentTime.getHours() % 12;
    
    // Create pulsing effect based on seconds
    useEffect(() => {
      const interval = setInterval(() => {
        setPulseScale(1 + Math.sin(Date.now() / 200) * 0.05);
      }, 50);
      
      return () => clearInterval(interval);
    }, []);

    return (
      <div className="relative w-80 h-80 flex items-center justify-center">
        <svg width="300" height="300" viewBox="0 0 300 300" className="absolute inset-0">
          {/* Organic blob background with gooey filter */}
          <defs>
            <filter id="gooey">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feColorMatrix in="blur" mode="matrix" values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 20 -10" result="gooey" />
              <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
            </filter>
          </defs>
          
          {/* Animated amoeba-like background */}
          <ellipse
            cx="150"
            cy="150"
            rx={80 + Math.sin(seconds * 0.1) * 10}
            ry={70 + Math.cos(seconds * 0.15) * 8}
            fill="rgba(59, 130, 246, 0.6)"
            filter="url(#gooey)"
            style={{
              transform: `rotate(${seconds * 6}deg) scale(${pulseScale})`,
              transformOrigin: 'center',
              transition: 'transform 0.1s ease-out'
            }}
          />
          
          {/* Secondary blob for more organic feel */}
          <ellipse
            cx={150 + Math.sin(minutes * 0.1) * 20}
            cy={150 + Math.cos(minutes * 0.08) * 15}
            rx={40 + Math.sin(seconds * 0.2) * 5}
            ry={35 + Math.cos(seconds * 0.25) * 4}
            fill="rgba(139, 69, 19, 0.4)"
            filter="url(#gooey)"
            style={{
              transform: `scale(${pulseScale * 0.8})`,
              transformOrigin: 'center'
            }}
          />
          
          {/* Time dots that move organically */}
          <circle
            cx={150 + Math.cos(hours * 30 * Math.PI / 180) * 60}
            cy={150 + Math.sin(hours * 30 * Math.PI / 180) * 60}
            r="12"
            fill="rgba(255, 255, 255, 0.9)"
            filter="url(#gooey)"
          />
          
          <circle
            cx={150 + Math.cos(minutes * 6 * Math.PI / 180) * 45}
            cy={150 + Math.sin(minutes * 6 * Math.PI / 180) * 45}
            r="8"
            fill="rgba(255, 255, 255, 0.8)"
            filter="url(#gooey)"
          />
          
          <circle
            cx={150 + Math.cos(seconds * 6 * Math.PI / 180) * 30}
            cy={150 + Math.sin(seconds * 6 * Math.PI / 180) * 30}
            r="6"
            fill="rgba(255, 255, 255, 0.7)"
            filter="url(#gooey)"
          />
          
          {/* Center dot */}
          <circle
            cx="150"
            cy="150"
            r="4"
            fill="rgba(255, 255, 255, 0.9)"
            style={{
              transform: `scale(${pulseScale})`,
              transformOrigin: 'center'
            }}
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

      {/* Sphere Clock Display */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="glassmorphism rounded-2xl p-8">
          <h2 className="font-serif text-2xl mb-8 text-center text-white" style={{fontFamily: 'Georgia, serif'}}>
            SPHERE CLOCK
          </h2>
          <AmoebaClockComponent currentTime={currentTime} />
        </div>
      </div>
    </div>
  );
}