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
  ballSize?: number;
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
              vx: (Math.random() - 0.5) * 3, // More horizontal velocity for bounce
              vy: 0.5, // Small initial downward velocity
              isSettled: false,
              ballSize: 16 // Regular size for minutes
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
                y: -30, // Start higher for larger balls
                vx: (Math.random() - 0.5) * 2.5, // More velocity for bigger bounces
                vy: 0, 
                isSettled: false,
                ballSize: 32 // Larger size for hours
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
            vx: (Math.random() - 0.5) * 3, 
            vy: 0.5, 
            isSettled: false,
            ballSize: 16 // Regular size for seconds
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
    
    // Helper function to create naturally settled balls with proper spacing
    const createSettledBalls = (count: number, ballSize: number = 16) => {
      const balls: Ball[] = [];
      const ballRadius = ballSize / 2;
      const minDistance = ballRadius * 2.2;
      const cylinderWidth = 64; // 80px total - 16px margins
      const cylinderLeft = 16;
      const bottomY = 320 - ballSize - 8; // Bottom position for this ball size
      
      for (let i = 0; i < count; i++) {
        let attempts = 0;
        let validPosition = false;
        let x, y;
        
        // Try to find a valid position that doesn't overlap
        while (!validPosition && attempts < 50) {
          // Calculate rough layer based on how many balls we can fit per layer
          const ballsPerLayer = Math.floor(cylinderWidth / minDistance);
          const layer = Math.floor(i / ballsPerLayer);
          const positionInLayer = i % ballsPerLayer;
          
          // Position within the layer with some randomness
          x = cylinderLeft + (positionInLayer * minDistance) + (Math.random() * 8 - 4);
          y = bottomY - (layer * minDistance) - (Math.random() * 4);
          
          // Ensure within cylinder bounds
          x = Math.max(cylinderLeft + ballRadius, Math.min(cylinderLeft + cylinderWidth - ballRadius, x));
          y = Math.max(ballRadius, y);
          
          // Check if this position overlaps with existing balls
          validPosition = true;
          for (const existingBall of balls) {
            const existingBallSize = existingBall.ballSize || 16;
            const existingBallRadius = existingBallSize / 2;
            const dx = x - existingBall.x;
            const dy = y - existingBall.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const requiredDistance = (ballRadius + existingBallRadius) * 1.1;
            
            if (distance < requiredDistance) {
              validPosition = false;
              break;
            }
          }
          attempts++;
        }
        
        // If we couldn't find a good position, place it anyway (stacked higher)
        if (!validPosition) {
          x = cylinderLeft + ballRadius + (Math.random() * (cylinderWidth - ballRadius * 2));
          y = bottomY - i * ballRadius; // Stack higher if needed
        }
        
        balls.push({
          id: ballIdRef.current++,
          x: x!,
          y: y!,
          vx: (Math.random() - 0.5) * 0.5, // Small random velocity for subtle movement
          vy: (Math.random() - 0.5) * 0.3,
          isSettled: false, // Start as dynamic, not settled
          ballSize: ballSize
        });
      }
      return balls;
    };
    
    setSecondBalls(createSettledBalls(seconds, 16));
    setMinuteBalls(createSettledBalls(minutes, 16));
    setHourBalls(createSettledBalls(hours, 32));
  }, []);

  // Physics animation loop
  useEffect(() => {
    const animate = () => {
      const updateBalls = (balls: Ball[], setBalls: React.Dispatch<React.SetStateAction<Ball[]>>) => {
        setBalls(prevBalls => 
          prevBalls.map(ball => {
            // Remove the settled check - all balls should always be affected by physics
            // if (ball.isSettled) return ball;

            let newX = ball.x + ball.vx;
            let newY = ball.y + ball.vy;
            let newVx = ball.vx;
            let newVy = ball.vy + 0.6; // Stronger gravity for more bounce
            
            // Calculate depth-based stability (balls lower in cylinder are more stable)
            const cylinderHeight = 320;
            const depthRatio = Math.max(0, (cylinderHeight - ball.y) / cylinderHeight); // 0 at top, 1 at bottom
            const stabilityFactor = Math.pow(depthRatio, 2); // Quadratic for more dramatic effect
            
            // Add random forces - less for deeper balls
            const randomForce = 0.02 * (1 - stabilityFactor * 0.8); // Reduce random forces for deep balls
            newVx += (Math.random() - 0.5) * randomForce;
            newVy += (Math.random() - 0.5) * randomForce;

            // Get ball size and radius for calculations
            const currentBallSize = ball.ballSize || 16;
            const currentBallRadius = currentBallSize / 2;

            // Wall collisions (cylinder walls) - adjust for ball size
            const wallMargin = currentBallRadius;
            if (newX <= 16 + wallMargin) { // Left wall
              newX = 16 + wallMargin;
              newVx = -newVx * 0.8; // More bounce, less damping
            }
            if (newX >= 64 - wallMargin) { // Right wall
              newX = 64 - wallMargin;
              newVx = -newVx * 0.8; // More bounce, less damping
            }

            // Check collision with other balls and bottom
            const otherBalls = prevBalls.filter(b => b.id !== ball.id);
            let hasCollision = false;
            
            // Check collision with other balls (both settled and moving)
            for (const otherBall of otherBalls) {
              const dx = newX - otherBall.x;
              const dy = newY - otherBall.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const otherBallSize = otherBall.ballSize || 16;
              const otherBallRadius = otherBallSize / 2;
              const minDistance = (currentBallRadius + otherBallRadius) * 1.1; // Slight spacing between balls
              
              if (distance < minDistance && distance > 0) {
                // Separate balls to prevent overlap
                const overlap = minDistance - distance;
                const separationForce = overlap * 0.6;
                
                const angle = Math.atan2(dy, dx);
                newX += Math.cos(angle) * separationForce;
                newY += Math.sin(angle) * separationForce;
                
                // Enhanced bouncing - strength depends on depth of both balls
                const otherDepthRatio = Math.max(0, (cylinderHeight - otherBall.y) / cylinderHeight);
                const otherStabilityFactor = Math.pow(otherDepthRatio, 2);
                const avgStability = (stabilityFactor + otherStabilityFactor) / 2;
                
                const bounceForce = 2.0 * (1 - avgStability * 0.6); // Reduce bounce for stable balls
                const relativeVelocity = Math.sqrt((ball.vx - otherBall.vx) ** 2 + (ball.vy - otherBall.vy) ** 2);
                const velocityMultiplier = Math.max(0.3, Math.min(2.0, relativeVelocity * 0.3));
                
                newVx += Math.cos(angle) * bounceForce * velocityMultiplier;
                newVy += Math.sin(angle) * bounceForce * velocityMultiplier;
                
                // More damping for deeper balls
                const dampingFactor = 0.9 - (stabilityFactor * 0.3);
                newVx *= dampingFactor;
                newVy *= dampingFactor;
                
                hasCollision = true;
              }
            }
            
            // Bottom collision (cylinder bottom)
            const bottomY = 320 - currentBallSize - 8; // Cylinder height minus ball size and margin
            if (newY >= bottomY) {
              newY = bottomY;
              newVy = -newVy * 0.6; // More bounce, less damping
              newVx *= 0.85; // Less friction for more natural movement
              hasCollision = true;
            }
            
            // Apply velocity caps
            if (Math.abs(newVx) > 10) newVx *= 0.95;
            if (Math.abs(newVy) > 15) newVy *= 0.95;
            
            // Depth-based energy damping - deeper balls lose energy faster
            const baseDamping = 0.999;
            const depthDamping = baseDamping - (stabilityFactor * 0.005); // More damping for deeper balls
            newVx *= depthDamping;
            newVy *= depthDamping;

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
    // Determine ball size based on cylinder type
    const isHourCylinder = label === "Hours";
    const ballSize = isHourCylinder ? 32 : 16; // Hours: 32px (2x larger), others: 16px
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
          {balls.map((ball) => {
            const currentBallSize = ball.ballSize || ballSize;
            return (
              <div
                key={ball.id}
                className="absolute bg-blue-500 rounded-full border border-blue-700"
                style={{
                  width: `${currentBallSize}px`,
                  height: `${currentBallSize}px`,
                  left: `${ball.x - currentBallSize/2}px`, // Center the ball
                  bottom: `${320 - ball.y - currentBallSize}px`, // Position from bottom
                  transition: 'none', // Let physics handle movement
                  zIndex: 5 // All balls have same z-index since they're all dynamic
                }}
              />
            );
          })}
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