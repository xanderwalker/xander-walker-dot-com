import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';

interface PixelBall {
  id: number;
  x: number;
  y: number;
  vy: number;
  isSettled: boolean;
  settledIndex?: number;
}

export default function HourglassClock() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pixelBalls, setPixelBalls] = useState<PixelBall[]>([]);
  const ballIdRef = useRef(0);
  const animationFrameRef = useRef<number>();
  const initializedRef = useRef(false);
  
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

  // Initialize balls based on current time
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      const currentMinutes = currentTime.getMinutes();
      const currentSeconds = currentTime.getSeconds();
      
      // Calculate total seconds passed in current hour
      const totalSecondsInHour = currentMinutes * 60 + currentSeconds;
      
      // Create initial sand grains filling flat across bottom 
      const initialBalls: PixelBall[] = [];
      const grainsNeeded = Math.floor(totalSecondsInHour / 10); // Reduce density since dropping every 100ms
      
      // Fill bottom flat layers first
      let currentLayer = 320; // Start at bottom
      let currentX = 5; // Start at left edge
      
      for (let i = 0; i < grainsNeeded; i++) {
        initialBalls.push({
          id: ballIdRef.current++,
          x: currentX,
          y: currentLayer,
          vy: 0,
          isSettled: true
        });
        
        // Move to next position
        currentX += 2; // 2-pixel wide grains
        
        // If reached end of tube, go to next layer
        if (currentX > 205) {
          currentX = 5;
          currentLayer--;
        }
      }
      
      setPixelBalls(initialBalls);
    }
  }, [currentTime]);

  // Drop sand every 100ms
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentMinute = now.getMinutes();
      const currentSecond = now.getSeconds();
      
      // Clear all balls at the start of each hour
      if (currentMinute === 0 && currentSecond === 0) {
        setPixelBalls([]);
        return;
      }
      
      // Drop 1 sand grain from center every 100ms
      const newBall: PixelBall = {
        id: ballIdRef.current++,
        x: 105, // Center of 200-pixel tube
        y: 0,
        vy: 1.0,
        isSettled: false
      };
      
      setPixelBalls(prev => [...prev, newBall]);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Physics animation loop
  useEffect(() => {
    const animate = () => {
      setPixelBalls(prev => {
        const settledPositions = new Set<string>();
        const newBalls = [...prev];
        
        // First pass: record all settled sand grain positions (2px wide)
        newBalls.forEach(ball => {
          if (ball.isSettled) {
            const roundedX = Math.round(ball.x);
            const roundedY = Math.round(ball.y);
            settledPositions.add(`${roundedX},${roundedY}`);
            settledPositions.add(`${roundedX + 1},${roundedY}`); // 2px wide
          }
        });

        // Second pass: update moving balls
        return newBalls.map(ball => {
          if (ball.isSettled) return ball;

          let newX = ball.x;
          let newY = ball.y + ball.vy;
          let newVy = ball.vy + 0.5; // Gravity
          let newIsSettled = false;

          const cylinderBottom = 320; // Moved to very bottom of container
          const cylinderLeft = 5;
          const cylinderRight = 205;
          
          // Hourglass sand spreading - when falling, sand spreads outward from center
          if (ball.vy > 0.5) {
            // Calculate distance from center and add outward spreading force
            const centerX = 105;
            const distanceFromCenter = newX - centerX;
            const spreadingForce = distanceFromCenter > 0 ? 0.3 : -0.3;
            newX += spreadingForce + (Math.random() - 0.5) * 1.0;
          }
          
          // When near settling, add more lateral movement for natural pile formation
          if (ball.vy < 1.0 && !ball.isSettled) {
            newX += (Math.random() - 0.5) * 1.5;
          }
          
          // Constrain to cylinder walls
          if (newX < cylinderLeft) newX = cylinderLeft;
          if (newX > cylinderRight) newX = cylinderRight;
          
          // Check collision with bottom or other sand grains (2px wide)
          const roundedX = Math.round(newX);
          const roundedY = Math.round(newY);
          
          // Check if position below is occupied or at bottom (check both pixels of 2px width)
          const collisionBelow = roundedY >= cylinderBottom || 
                                settledPositions.has(`${roundedX},${roundedY + 1}`) ||
                                settledPositions.has(`${roundedX + 1},${roundedY + 1}`);
          
          if (collisionBelow) {
            // Find natural sand-like settling position
            let finalY = cylinderBottom;
            let finalX = roundedX;
            let found = false;
            
            // Check if can settle directly below current position (check 2px width)
            const targetY = Math.min(cylinderBottom, roundedY);
            if (!settledPositions.has(`${roundedX},${targetY}`) && 
                !settledPositions.has(`${roundedX + 1},${targetY}`)) {
              finalY = targetY;
              finalX = roundedX;
              found = true;
            } else {
              // Look for the next available spot by moving outward from center
              const centerX = 105;
              const maxSearchRadius = 100;
              
              for (let radius = 1; radius <= maxSearchRadius && !found; radius++) {
                // Try positions at this radius from the center
                for (let angle = 0; angle < 360 && !found; angle += 15) {
                  const searchX = Math.round(centerX + radius * Math.cos(angle * Math.PI / 180));
                  
                  if (searchX >= cylinderLeft && searchX <= cylinderRight - 1) {
                    // Find the surface level at this x position
                    for (let y = cylinderBottom; y >= 0 && !found; y--) {
                      if (!settledPositions.has(`${searchX},${y}`) && 
                          !settledPositions.has(`${searchX + 1},${y}`)) {
                        // Check if this position has support below it (unless at bottom)
                        if (y === cylinderBottom || 
                            settledPositions.has(`${searchX},${y + 1}`) || 
                            settledPositions.has(`${searchX + 1},${y + 1}`)) {
                          finalY = y;
                          finalX = searchX;
                          found = true;
                        }
                      }
                    }
                  }
                }
              }
            }
            
            newY = finalY;
            newX = finalX;
            newVy = 0;
            newIsSettled = true;
            // Mark both pixels of the 2px wide sand grain as occupied
            settledPositions.add(`${finalX},${finalY}`);
            settledPositions.add(`${finalX + 1},${finalY}`);
          }

          return {
            ...ball,
            x: newX,
            y: newY,
            vy: newVy,
            isSettled: newIsSettled
          };
        });
      });

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
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
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

      {/* Hourglass Clock Display */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] space-y-12">
        <div className="glassmorphism rounded-2xl p-8">
          <h2 className="font-serif text-2xl mb-8 text-center text-white" style={{fontFamily: 'Georgia, serif'}}>
            HOURGLASS CLOCK
          </h2>
          
          <div className="relative">
            {/* Hourglass tube container */}
            <div 
              className="relative border-4 border-gray-800 mx-auto bg-transparent overflow-hidden"
              style={{
                width: '210px',
                height: '340px',
                borderRadius: '0 0 8px 8px'
              }}
            >
              {/* Time markers on the side */}
              {Array.from({ length: 12 }, (_, i) => (
                <div
                  key={i}
                  className="absolute left-[-60px] text-sm text-white font-serif"
                  style={{
                    fontFamily: 'Georgia, serif',
                    top: `${30 + i * 25}px`
                  }}
                >
                  {60 - (i + 1) * 5}m
                </div>
              ))}
              
              {/* Render sand grains (2x1 pixels) */}
              {pixelBalls.map(ball => (
                <div
                  key={ball.id}
                  className="absolute bg-yellow-600"
                  style={{
                    left: `${ball.x}px`,
                    top: `${ball.y}px`,
                    width: '2px',
                    height: '1px'
                  }}
                />
              ))}
            </div>
            
            {/* Digital time display */}
            <div className="text-center mt-6">
              <div className="font-serif text-3xl text-white" style={{fontFamily: 'Georgia, serif'}}>
                {formatTime(currentTime)}
              </div>
            </div>
            
            {/* Stats */}
            <div className="text-sm mt-2 text-center text-white font-serif" style={{fontFamily: 'Georgia, serif'}}>
              <div>Grains: {pixelBalls.length}</div>
              <div>Settled: {pixelBalls.filter(b => b.isSettled).length}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}