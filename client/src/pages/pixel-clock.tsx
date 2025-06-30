import { Link } from 'wouter';
import { useState, useEffect, useRef } from 'react';

interface PixelBall {
  id: number;
  x: number;
  y: number;
  vy: number;
  isSettled: boolean;
  settledIndex?: number;
}

export default function PixelClock() {
  const [time, setTime] = useState(new Date());
  const [pixelBalls, setPixelBalls] = useState<PixelBall[]>([]);
  const ballIdRef = useRef(0);
  const lastSecondRef = useRef(-1);
  const animationFrameRef = useRef<number>();
  const dropCountRef = useRef(0);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Drop 10 balls every second
  useEffect(() => {
    const currentSecond = time.getSeconds();
    
    // Check if second has changed
    if (lastSecondRef.current !== currentSecond) {
      lastSecondRef.current = currentSecond;
      
      // Clear all balls at the start of each minute (when seconds = 0)
      if (currentSecond === 0) {
        setPixelBalls([]);
        dropCountRef.current = 0;
        return;
      }
      
      // Drop 10 new pixel balls
      const newBalls: PixelBall[] = [];
      for (let i = 0; i < 10; i++) {
        newBalls.push({
          id: ballIdRef.current++,
          x: 39 + Math.random() * 2, // Random position across 2px width
          y: 0,
          vy: 0.5 + Math.random() * 0.5, // Random falling speed
          isSettled: false
        });
      }
      
      setPixelBalls(prev => [...prev, ...newBalls]);
      dropCountRef.current += 10;
    }
  }, [time]);

  // Physics animation
  useEffect(() => {
    const animate = () => {
      setPixelBalls(prev => 
        prev.map(ball => {
          if (ball.isSettled) return ball;
          
          let newY = ball.y + ball.vy;
          let newVy = ball.vy + 0.1; // Gravity
          let newIsSettled = false;
          let settledIndex = ball.settledIndex;
          
          const cylinderBottom = 280;
          const cylinderWidth = 80;
          
          // Check collision with bottom or other settled balls
          const settledBalls = prev.filter(b => b.isSettled);
          const maxSettledHeight = settledBalls.length > 0 
            ? Math.max(...settledBalls.map(b => cylinderBottom - (b.settledIndex || 0)))
            : cylinderBottom;
          
          if (newY >= maxSettledHeight - 1) {
            newY = maxSettledHeight - 1;
            newVy = 0;
            newIsSettled = true;
            settledIndex = settledBalls.length;
          }
          
          return {
            ...ball,
            y: newY,
            vy: newVy,
            isSettled: newIsSettled,
            settledIndex
          };
        })
      );
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const PixelCylinder = () => {
    return (
      <div className="flex flex-col items-center">
        <div className=" text-lg mb-2 text-black" style={{fontFamily: 'Georgia, serif'}}>Seconds</div>
        <div className="relative w-20 h-80 overflow-hidden" style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
          borderRadius: '8px',
          border: '2px solid rgba(0,0,0,0.1)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
        }}>
          
          {/* Measurement marks */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute right-0 w-2 h-0.5 bg-gray-400" style={{
              top: `${(i + 1) * (320 / 6) - 1}px`
            }} />
          ))}
          
          {/* Second markers */}
          {[...Array(12)].map((_, i) => (
            <div key={i} className="absolute left-0 text-xs text-gray-600" style={{
              fontFamily: 'Georgia, serif',
              top: `${(i + 1) * (320 / 12) - 8}px`,
              fontSize: '10px'
            }}>
              {60 - (i + 1) * 5}
            </div>
          ))}
          
          {/* Render pixel balls */}
          {pixelBalls.map(ball => (
            <div
              key={ball.id}
              className="absolute w-1 h-1 bg-blue-600 rounded-full"
              style={{
                left: `${ball.x}px`,
                top: `${ball.y}px`,
                transition: ball.isSettled ? 'none' : 'none'
              }}
            />
          ))}
          
        </div>
        <div className="text-sm mt-2 text-center text-black " style={{fontFamily: 'Georgia, serif'}}>
          <div>Balls: {pixelBalls.length}</div>
          <div>Settled: {pixelBalls.filter(b => b.isSettled).length}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-gray-100 to-gray-200 text-black p-4">
      {/* Header */}
      <header className="flex items-center justify-between max-w-6xl mx-auto mb-8">
        <Link href="/projects" className="text-blue-600 hover:text-blue-700  text-lg transition-colors" style={{fontFamily: 'Georgia, serif'}}>
          ← BACK TO PROJECTS
        </Link>
        
        <div className="text-center">
          <h1 className=" text-4xl font-bold text-black" style={{fontFamily: 'Georgia, serif'}}>
            XANDER WALKER
          </h1>
        </div>
        
        <div className="w-48"></div>
      </header>

      {/* Clock Display */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] space-y-12">
        
        {/* Digital Clock */}
        <div className="glassmorphism rounded-2xl p-12 text-center">
          <div className=" text-6xl md:text-7xl mb-4 text-black tracking-wider" style={{fontFamily: 'Georgia, serif'}}>
            {formatTime(time)}
          </div>
          <div className="text-xl text-gray-600 uppercase tracking-widest " style={{fontFamily: 'Georgia, serif'}}>
            {time.toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
        
        {/* Pixel Ball Drop Clock */}
        <div className="glassmorphism rounded-2xl p-8">
          <h2 className=" text-2xl mb-8 text-center text-black" style={{fontFamily: 'Georgia, serif'}}>
            PIXEL BALL DROP CLOCK
          </h2>
          <div className="flex justify-center">
            <PixelCylinder />
          </div>
          
          {/* Instructions */}
          <div className="mt-6 text-center text-sm text-gray-600 " style={{fontFamily: 'Georgia, serif'}}>
            <p>10 pixel balls drop every second</p>
            <p>Cylinder clears at the start of each minute</p>
          </div>
        </div>

      </div>
    </div>
  );
}