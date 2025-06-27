import { Link } from 'wouter';
import { useState, useEffect, useRef } from 'react';

export default function Clock() {
  const [time, setTime] = useState(new Date());
  
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
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
      
      {/* Header with navigation back to projects */}
      <header className="p-8 flex justify-between items-center relative z-10">
        <Link href="/projects">
          <button className="text-white hover:text-gray-200 transition-colors text-lg backdrop-blur-sm bg-black/20 px-4 py-2 rounded-lg border border-white/20">
            ← BACK TO PROJECTS
          </button>
        </Link>
        
        <Link href="/">
          <h1 className="text-white font-xanman-wide font-bold text-4xl md:text-6xl hover:opacity-70 transition-opacity duration-200 cursor-pointer drop-shadow-lg">
            XANDER WALKER
          </h1>
        </Link>
        
        <div className="w-48"></div> {/* Spacer for center alignment */}
      </header>

      {/* Clocks Display */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] space-y-12">
        
        {/* Hourglass Clock Card */}
        <Link href="/projects/clock/hourglass">
          <div className="glassmorphism rounded-2xl p-8 cursor-pointer hover:bg-white/30 transition-all duration-300 transform hover:scale-105">
            <h2 className="font-serif text-2xl mb-8 text-center text-white drop-shadow-lg" style={{fontFamily: 'Georgia, serif'}}>
              🔃 HOURGLASS CLOCK
            </h2>
            <div className="h-48 flex items-center justify-center">
              <div className="text-center text-white/80">
                <div className="text-6xl mb-4">⏳</div>
                <p className="text-lg">Watch sand grains drop and accumulate in real-time</p>
              </div>
            </div>
          </div>
        </Link>
        
        {/* Sphere Clock Card */}
        <Link href="/projects/clock/sphere">
          <div className="glassmorphism rounded-2xl p-8 cursor-pointer hover:bg-white/30 transition-all duration-300 transform hover:scale-105">
            <h2 className="font-serif text-2xl mb-8 text-center text-white drop-shadow-lg" style={{fontFamily: 'Georgia, serif'}}>
              🔮 SPHERE CLOCK
            </h2>
            <div className="h-48 flex items-center justify-center">
              <div className="text-center text-white/80">
                <div className="text-6xl mb-4">🌊</div>
                <p className="text-lg">Organic flowing time visualization</p>
              </div>
            </div>
          </div>
        </Link>
        
        {/* Analog Clock Card */}
        <Link href="/projects/clock/analog">
          <div className="glassmorphism rounded-2xl p-8 cursor-pointer hover:bg-white/30 transition-all duration-300 transform hover:scale-105">
            <h2 className="font-serif text-2xl mb-8 text-center text-white drop-shadow-lg" style={{fontFamily: 'Georgia, serif'}}>
              🕐 ANALOG CLOCK
            </h2>
            <div className="h-48 flex items-center justify-center">
              <div className="text-center text-white/80">
                <div className="text-6xl mb-4">⏰</div>
                <p className="text-lg">Traditional clock with flowing hands</p>
              </div>
            </div>
          </div>
        </Link>
        
        {/* Year Progress Clock Card */}
        <Link href="/projects/clock/year">
          <div className="glassmorphism rounded-2xl p-8 cursor-pointer hover:bg-white/30 transition-all duration-300 transform hover:scale-105">
            <h2 className="font-serif text-2xl mb-8 text-center text-white drop-shadow-lg" style={{fontFamily: 'Georgia, serif'}}>
              📅 YEAR PROGRESS CLOCK
            </h2>
            <div className="h-48 flex items-center justify-center">
              <div className="text-center text-white/80">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-lg">Track your progress through the year</p>
              </div>
            </div>
          </div>
        </Link>
        
        {/* Digital Time Display */}
        <div className="glassmorphism rounded-2xl p-8 text-center backdrop-blur-md bg-white/10">
          <div className="font-serif text-4xl md:text-6xl mb-4 text-white drop-shadow-lg tracking-wider" style={{fontFamily: 'Georgia, serif'}}>
            {formatTime(time)}
          </div>
          <div className="text-lg text-white/80 uppercase tracking-widest drop-shadow-lg" style={{fontFamily: 'Georgia, serif'}}>
            {formatDate(time)}
          </div>
        </div>
      </div>
    </div>
  );
}