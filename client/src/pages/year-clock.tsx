import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';

const getDayOfYear = (date: Date) => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

export default function YearClock() {
  const [currentTime, setCurrentTime] = useState(new Date());

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

  const formatTime = (date: Date) => {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const currentYear = currentTime.getFullYear();
  const currentDayOfYear = getDayOfYear(currentTime);
  const totalDays = 365;
  const progressPercentage = (currentDayOfYear / totalDays) * 100;

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

      {/* Year Progress Clock */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="glassmorphism rounded-2xl p-12 backdrop-blur-md bg-white/10 max-w-4xl w-full mx-4">
          <h2 className="font-serif text-3xl mb-8 text-center text-white drop-shadow-lg" style={{fontFamily: 'Georgia, serif'}}>
            YEAR PROGRESS CLOCK
          </h2>
          
          <div className="flex flex-col items-center space-y-8">
            {/* Current time and date */}
            <div className="text-center space-y-2">
              <div className="font-serif text-3xl text-white drop-shadow-lg" style={{fontFamily: 'Georgia, serif'}}>
                {formatTime(currentTime)}
              </div>
              <div className="font-serif text-lg text-white/80 drop-shadow-lg" style={{fontFamily: 'Georgia, serif'}}>
                {formatDate(currentTime)}
              </div>
            </div>
            
            {/* Year progress statistics */}
            <div className="text-center space-y-4">
              <div className="font-serif text-5xl font-bold text-white drop-shadow-lg" style={{fontFamily: 'Georgia, serif'}}>
                {Math.round(progressPercentage)}%
              </div>
              <div className="font-serif text-xl text-white/90 drop-shadow-lg" style={{fontFamily: 'Georgia, serif'}}>
                YEAR {currentYear} PROGRESS
              </div>
              <div className="font-serif text-lg text-white/80 drop-shadow-lg" style={{fontFamily: 'Georgia, serif'}}>
                DAY {currentDayOfYear} OF {totalDays}
              </div>
            </div>
            
            {/* Progress visualization */}
            <div className="w-full max-w-2xl space-y-6">
              {/* Main progress bar */}
              <div className="w-full h-12 bg-black/30 rounded-lg overflow-hidden backdrop-blur-sm border border-white/20">
                <div 
                  className="h-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 transition-all duration-1000 relative overflow-hidden"
                  style={{ width: `${progressPercentage}%` }}
                >
                  {/* Animated flow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                </div>
              </div>
              
              {/* Monthly breakdown */}
              <div className="grid grid-cols-12 gap-1">
                {Array.from({ length: 12 }, (_, i) => {
                  const month = i + 1;
                  const daysInMonth = new Date(currentYear, month, 0).getDate();
                  const monthStartDay = getDayOfYear(new Date(currentYear, i, 1));
                  const monthEndDay = monthStartDay + daysInMonth - 1;
                  const isCurrentMonth = currentTime.getMonth() === i;
                  const isCompleted = currentDayOfYear > monthEndDay;
                  const isPartial = currentDayOfYear >= monthStartDay && currentDayOfYear <= monthEndDay;
                  
                  let monthProgress = 0;
                  if (isCompleted) monthProgress = 100;
                  else if (isPartial) {
                    monthProgress = ((currentDayOfYear - monthStartDay + 1) / daysInMonth) * 100;
                  }
                  
                  return (
                    <div key={i} className="relative">
                      <div className="h-8 bg-black/30 rounded backdrop-blur-sm border border-white/20 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            isCurrentMonth ? 'bg-gradient-to-t from-yellow-400 to-orange-500' :
                            isCompleted ? 'bg-gradient-to-t from-green-400 to-blue-500' :
                            'bg-gradient-to-t from-gray-400 to-gray-600'
                          }`}
                          style={{ width: `${monthProgress}%` }}
                        />
                      </div>
                      <div className="text-xs text-white/70 text-center mt-1" style={{fontFamily: 'Georgia, serif'}}>
                        {new Date(currentYear, i, 1).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Additional statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-2xl">
              <div className="text-center backdrop-blur-sm bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="font-serif text-2xl font-bold text-white" style={{fontFamily: 'Georgia, serif'}}>
                  {365 - currentDayOfYear}
                </div>
                <div className="font-serif text-sm text-white/80" style={{fontFamily: 'Georgia, serif'}}>
                  Days Left
                </div>
              </div>
              
              <div className="text-center backdrop-blur-sm bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="font-serif text-2xl font-bold text-white" style={{fontFamily: 'Georgia, serif'}}>
                  {Math.ceil((365 - currentDayOfYear) / 7)}
                </div>
                <div className="font-serif text-sm text-white/80" style={{fontFamily: 'Georgia, serif'}}>
                  Weeks Left
                </div>
              </div>
              
              <div className="text-center backdrop-blur-sm bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="font-serif text-2xl font-bold text-white" style={{fontFamily: 'Georgia, serif'}}>
                  {12 - currentTime.getMonth()}
                </div>
                <div className="font-serif text-sm text-white/80" style={{fontFamily: 'Georgia, serif'}}>
                  Months Left
                </div>
              </div>
              
              <div className="text-center backdrop-blur-sm bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="font-serif text-2xl font-bold text-white" style={{fontFamily: 'Georgia, serif'}}>
                  Q{Math.ceil((currentTime.getMonth() + 1) / 3)}
                </div>
                <div className="font-serif text-sm text-white/80" style={{fontFamily: 'Georgia, serif'}}>
                  Current Quarter
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}