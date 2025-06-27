import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';

export default function SphereClock() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pulseScale, setPulseScale] = useState(1);

  // Mouse movement for paint swirling (desktop)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [deviceMotion, setDeviceMotion] = useState({ x: 0, y: 0, z: 0 });
  const backgroundRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth) * 100;
      const y = (event.clientY / window.innerHeight) * 100;
      setMousePosition({ x, y });
      
      if (backgroundRef.current) {
        backgroundRef.current.style.setProperty('--mouse-x', `${x}%`);
        backgroundRef.current.style.setProperty('--mouse-y', `${y}%`);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      if (event.accelerationIncludingGravity) {
        const x = Math.max(-50, Math.min(50, (event.accelerationIncludingGravity.x || 0) * 5));
        const y = Math.max(-50, Math.min(50, (event.accelerationIncludingGravity.y || 0) * 5));
        const z = Math.max(-50, Math.min(50, (event.accelerationIncludingGravity.z || 0) * 5));
        
        setDeviceMotion({ x, y, z });
        
        if (backgroundRef.current) {
          backgroundRef.current.style.setProperty('--tilt-x', `${x + 50}%`);
          backgroundRef.current.style.setProperty('--tilt-y', `${y + 50}%`);
          backgroundRef.current.style.setProperty('--tilt-z', `${z + 50}%`);
        }
      }
    };

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

  // Pulse effect based on seconds
  useEffect(() => {
    const seconds = currentTime.getSeconds();
    const pulseIntensity = 1 + (seconds % 10) * 0.05; // Pulse every 10 seconds
    setPulseScale(pulseIntensity);
  }, [currentTime]);

  const formatTime = (date: Date) => {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
  };

  const hours = currentTime.getHours() % 12 || 12;
  const minutes = currentTime.getMinutes();
  const seconds = currentTime.getSeconds();

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
        
        <div className="w-48"></div>
      </header>

      {/* Sphere Clock */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="glassmorphism rounded-2xl p-8 backdrop-blur-md bg-white/10">
          <h2 className="font-serif text-3xl mb-8 text-center text-white drop-shadow-lg" style={{fontFamily: 'Georgia, serif'}}>
            SPHERE CLOCK
          </h2>
          
          <div className="flex flex-col items-center space-y-8">
            {/* Digital time display */}
            <div className="font-serif text-2xl text-white text-center drop-shadow-lg" style={{fontFamily: 'Georgia, serif'}}>
              {formatTime(currentTime)}
            </div>
            
            {/* Amoeba-style clock container */}
            <div className="relative w-80 h-80">
              <svg width="320" height="320" viewBox="0 0 320 320" className="drop-shadow-lg">
                <defs>
                  <filter id="gooey">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
                    <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="gooey" />
                    <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
                  </filter>
                </defs>
                
                {/* Hour markers as flowing organic shapes */}
                {Array.from({ length: 12 }, (_, i) => {
                  const angle = (i * 30 - 90) * Math.PI / 180;
                  const radius = 120;
                  const x = 160 + radius * Math.cos(angle);
                  const y = 160 + radius * Math.sin(angle);
                  const isCurrentHour = i + 1 === hours;
                  
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r={isCurrentHour ? 12 : 8}
                      fill={isCurrentHour ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.6)"}
                      filter="url(#gooey)"
                      style={{
                        transform: `scale(${isCurrentHour ? pulseScale : 1})`,
                        transformOrigin: `${x}px ${y}px`,
                        transition: 'transform 0.3s ease-out'
                      }}
                    />
                  );
                })}
                
                {/* Minute markers as smaller flowing dots */}
                {Array.from({ length: 60 }, (_, i) => {
                  if (i % 5 === 0) return null; // Skip hour positions
                  const angle = (i * 6 - 90) * Math.PI / 180;
                  const radius = 130;
                  const x = 160 + radius * Math.cos(angle);
                  const y = 160 + radius * Math.sin(angle);
                  const isCurrentMinute = i === minutes;
                  
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r={isCurrentMinute ? 6 : 3}
                      fill={isCurrentMinute ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.3)"}
                      filter="url(#gooey)"
                      style={{
                        transform: `scale(${isCurrentMinute ? pulseScale * 1.2 : 1})`,
                        transformOrigin: `${x}px ${y}px`,
                        transition: 'transform 0.1s ease-out'
                      }}
                    />
                  );
                })}
                
                {/* Central amoeba-like mass */}
                <circle
                  cx="160"
                  cy="160"
                  r="40"
                  fill="rgba(255, 255, 255, 0.8)"
                  filter="url(#gooey)"
                  style={{
                    transform: `scale(${pulseScale})`,
                    transformOrigin: 'center',
                    transition: 'transform 0.3s ease-out'
                  }}
                />
                
                {/* Second indicator as pulsing center */}
                <circle
                  cx="160"
                  cy="160"
                  r={8 + (seconds % 5) * 2}
                  fill="rgba(255, 255, 255, 1)"
                  filter="url(#gooey)"
                  style={{
                    transform: `scale(${pulseScale * 1.5})`,
                    transformOrigin: 'center',
                    transition: 'transform 0.1s ease-out'
                  }}
                />
                
                {/* Glossy highlight */}
                <ellipse
                  cx="140"
                  cy="130"
                  rx="15"
                  ry="25"
                  fill="rgba(255, 255, 255, 0.4)"
                  style={{
                    transform: `scale(${pulseScale * 0.9})`,
                    transformOrigin: 'center',
                    transition: 'transform 0.1s ease-out'
                  }}
                />
              </svg>
            </div>
            
            <div className="text-sm text-center text-white/80 backdrop-blur-sm bg-black/20 px-4 py-2 rounded-lg" style={{fontFamily: 'Georgia, serif'}}>
              <div>Hour: {hours} | Minute: {minutes} | Second: {seconds}</div>
              <div>Organic time visualization with flowing markers</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}