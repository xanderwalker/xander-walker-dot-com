import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';

const getDayOfYear = (date: Date) => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

export default function YearClock() {
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

  const YearClockComponent = ({ currentDate }: { currentDate: Date }) => {
    const currentYear = currentDate.getFullYear();
    const currentDayOfYear = getDayOfYear(currentDate);
    const totalDays = 365;
    
    return (
      <div className="w-full max-w-5xl">
        <div className="text-center mb-6">
          <h3 className="font-serif text-lg text-white mb-1" style={{fontFamily: 'Georgia, serif'}}>
            YEAR PROGRESS {currentYear}
          </h3>
          <div className="font-serif text-2xl font-bold text-white" style={{fontFamily: 'Georgia, serif'}}>
            {Math.round((currentDayOfYear / totalDays) * 100)}%
          </div>
          <div className="font-serif text-sm text-gray-300" style={{fontFamily: 'Georgia, serif'}}>
            DAY {currentDayOfYear} OF {totalDays}
          </div>
        </div>
        
        {/* Simple Progress Bar */}
        <div className="w-full h-8 bg-gray-800/50 rounded-lg overflow-hidden backdrop-blur-sm border border-white/20">
          {/* Red progress fill */}
          <div 
            className="h-full bg-red-500 transition-all duration-1000"
            style={{ width: `${(currentDayOfYear / totalDays) * 100}%` }}
          />
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

      {/* Year Clock Display */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="glassmorphism rounded-2xl p-8 w-full max-w-6xl">
          <h2 className="font-serif text-2xl mb-8 text-center text-white" style={{fontFamily: 'Georgia, serif'}}>
            YEAR PROGRESS CLOCK
          </h2>
          <YearClockComponent currentDate={currentTime} />
        </div>
      </div>
    </div>
  );
}