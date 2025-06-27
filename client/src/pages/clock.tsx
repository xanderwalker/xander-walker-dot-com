import { Link } from 'wouter';
import { useState, useEffect, useRef } from 'react';

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isSettled: boolean;
  settledIndex?: number;
}

export default function Clock() {
  const [time, setTime] = useState(new Date());
  const [secondBalls, setSecondBalls] = useState<Ball[]>([]);
  const [minuteBalls, setMinuteBalls] = useState<Ball[]>([]);
  const [hourBalls, setHourBalls] = useState<Ball[]>([]);
  const ballIdRef = useRef(0);
  const lastSecondRef = useRef(-1);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now);
      
      const currentSecond = now.getSeconds();
      const currentMinute = now.getMinutes();
      const currentHour = now.getHours() % 12;
      
      // Add new ball every second
      if (currentSecond !== lastSecondRef.current) {
        lastSecondRef.current = currentSecond;
        
        if (currentSecond === 0) {
          // Reset seconds, add to minutes
          setSecondBalls([]);
          setMinuteBalls(prev => {
            const newBall: Ball = { 
              id: ballIdRef.current++, 
              x: 40, // Center of cylinder (80px width / 2)
              y: -20, // Start above cylinder
              vx: (Math.random() - 0.5) * 2, // Random horizontal velocity
              vy: 0, // Start with no vertical velocity
              isSettled: false 
            };
            const newBalls = [...prev, newBall];
            return newBalls.slice(-currentMinute || -60);
          });
          
          // If minute is 0, add to hours
          if (currentMinute === 0) {
            setMinuteBalls([]);
            setHourBalls(prev => {
              const newBall: Ball = { 
                id: ballIdRef.current++, 
                x: 40, 
                y: -20, 
                vx: (Math.random() - 0.5) * 2, 
                vy: 0, 
                isSettled: false 
              };
              const newBalls = [...prev, newBall];
              return newBalls.slice(-currentHour || -12);
            });
          }
        } else {
          // Add ball to seconds
          const newBall: Ball = { 
            id: ballIdRef.current++, 
            x: 40, 
            y: -20, 
            vx: (Math.random() - 0.5) * 2, 
            vy: 0, 
            isSettled: false 
          };
          setSecondBalls(prev => [...prev, newBall]);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Initialize balls based on current time
  useEffect(() => {
    const now = new Date();
    const seconds = now.getSeconds();
    const minutes = now.getMinutes();
    const hours = now.getHours() % 12;
    
    setSecondBalls(Array.from({ length: seconds }, (_, i) => ({
      id: ballIdRef.current++,
      x: 40,
      y: 320 - (i * 16), // Stack settled balls from bottom
      vx: 0,
      vy: 0,
      isSettled: true,
      settledIndex: i
    })));
    
    setMinuteBalls(Array.from({ length: minutes }, (_, i) => ({
      id: ballIdRef.current++,
      x: 40,
      y: 320 - (i * 16),
      vx: 0,
      vy: 0,
      isSettled: true,
      settledIndex: i
    })));
    
    setHourBalls(Array.from({ length: hours }, (_, i) => ({
      id: ballIdRef.current++,
      x: 40,
      y: 320 - (i * 16),
      vx: 0,
      vy: 0,
      isSettled: true,
      settledIndex: i
    })));
  }, []);

  // Physics animation loop
  useEffect(() => {
    const animate = () => {
      const updateBalls = (balls: Ball[], setBalls: React.Dispatch<React.SetStateAction<Ball[]>>) => {
        setBalls(prevBalls => 
          prevBalls.map(ball => {
            if (ball.isSettled) return ball;

            let newX = ball.x + ball.vx;
            let newY = ball.y + ball.vy;
            let newVx = ball.vx;
            let newVy = ball.vy + 0.5; // Gravity

            // Wall collisions (cylinder walls)
            if (newX <= 8) { // Left wall
              newX = 8;
              newVx = -newVx * 0.7; // Bounce with damping
            }
            if (newX >= 72) { // Right wall (80px - 8px for ball width)
              newX = 72;
              newVx = -newVx * 0.7;
            }

            // Bottom collision (cylinder bottom)
            const settledBalls = prevBalls.filter(b => b.isSettled);
            const expectedBottomY = 304 - (settledBalls.length * 16); // 320px - 16px for ball height
            
            if (newY >= expectedBottomY) {
              newY = expectedBottomY;
              newVy = -newVy * 0.4; // Bounce with heavy damping
              newVx *= 0.8; // Friction
              
              // Check if ball should settle
              if (Math.abs(newVy) < 1 && Math.abs(newVx) < 1) {
                return {
                  ...ball,
                  x: 40, // Center
                  y: expectedBottomY,
                  vx: 0,
                  vy: 0,
                  isSettled: true,
                  settledIndex: settledBalls.length
                };
              }
            }

            return {
              ...ball,
              x: newX,
              y: newY,
              vx: newVx,
              vy: newVy
            };
          })
        );
      };

      updateBalls(secondBalls, setSecondBalls);
      updateBalls(minuteBalls, setMinuteBalls);
      updateBalls(hourBalls, setHourBalls);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [secondBalls, minuteBalls, hourBalls]);

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

  const GraduatedCylinder = ({ balls, maxBalls, label, unit }: { 
    balls: Ball[], 
    maxBalls: number, 
    label: string,
    unit: string 
  }) => {
    return (
      <div className="flex flex-col items-center">
        <div className="font-serif text-lg mb-2" style={{fontFamily: 'Georgia, serif'}}>{label}</div>
        <div className="relative w-20 h-80 border-2 border-black rounded-b-lg bg-white overflow-hidden">
          {/* Graduated markings */}
          {Array.from({ length: Math.min(maxBalls + 1, 13) }, (_, i) => (
            <div key={i} className="absolute right-0 w-full border-t border-gray-300" 
                 style={{ bottom: `${(i / maxBalls) * 100}%` }}>
              <span className="absolute -right-8 text-xs text-gray-600 transform -translate-y-1/2">
                {maxBalls - i}
              </span>
            </div>
          ))}
          
          {/* Balls */}
          {balls.map((ball) => (
            <div
              key={ball.id}
              className="absolute w-4 h-4 bg-blue-500 rounded-full border border-blue-700"
              style={{
                left: `${ball.x - 8}px`, // Center the ball (16px width / 2)
                bottom: `${320 - ball.y - 16}px`, // Position from bottom
                transition: 'none', // Let physics handle movement
                zIndex: ball.isSettled ? 1 : 10 // Falling balls appear above settled ones
              }}
            />
          ))}
        </div>
        <div className="font-serif text-sm mt-1 text-gray-600" style={{fontFamily: 'Georgia, serif'}}>
          {balls.length} {unit}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header with navigation back to projects */}
      <header className="p-8 flex justify-between items-center">
        <Link href="/projects">
          <button className="text-black hover:text-gray-600 transition-colors text-lg">
            ← BACK TO PROJECTS
          </button>
        </Link>
        
        <Link href="/">
          <h1 className="text-black font-xanman-wide font-bold text-4xl md:text-6xl hover:opacity-70 transition-opacity duration-200 cursor-pointer">
            XANDER WALKER
          </h1>
        </Link>
        
        <div className="w-48"></div> {/* Spacer for center alignment */}
      </header>

      {/* Clocks Display */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] space-y-12">
        
        {/* Graduated Cylinder Clock */}
        <div className="glassmorphism rounded-2xl p-8">
          <h2 className="font-serif text-2xl mb-8 text-center text-black" style={{fontFamily: 'Georgia, serif'}}>
            Ball Drop Clock
          </h2>
          <div className="flex justify-center space-x-8">
            <GraduatedCylinder 
              balls={hourBalls} 
              maxBalls={12} 
              label="Hours" 
              unit="hrs"
            />
            <GraduatedCylinder 
              balls={minuteBalls} 
              maxBalls={60} 
              label="Minutes" 
              unit="min"
            />
            <GraduatedCylinder 
              balls={secondBalls} 
              maxBalls={60} 
              label="Seconds" 
              unit="sec"
            />
          </div>
        </div>

        {/* Digital Clock */}
        <div className="glassmorphism rounded-2xl p-12 text-center">
          <div className="font-xanman-wide text-6xl md:text-7xl mb-4 text-black tracking-wider">
            {formatTime(time)}
          </div>
          <div className="text-xl text-gray-600 uppercase tracking-widest">
            {formatDate(time)}
          </div>
        </div>
      </div>
    </div>
  );
}