import { useRef, useEffect, useState } from 'react';

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  isLetter?: boolean;
  letter?: string;
  rotation?: number;
  rotationSpeed?: number;
}

export default function PhysicsBalls() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [balls, setBalls] = useState<Ball[]>([]);
  const animationRef = useRef<number>();
  const [acceleration, setAcceleration] = useState({ x: 0, y: 0, z: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(false);
  const [showMotionButton, setShowMotionButton] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const isMobileDevice = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobile(isMobileDevice);
      
      // Show motion button on mobile if motion isn't already enabled
      if (isMobileDevice && !motionEnabled) {
        setShowMotionButton(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [motionEnabled]);

  // Enable motion function
  const enableMotion = async () => {
    let success = false;

    const setupAccelerometer = () => {
      const handleDeviceMotion = (event: DeviceMotionEvent) => {
        if (event.accelerationIncludingGravity) {
          const x = event.accelerationIncludingGravity.x || 0;
          const y = event.accelerationIncludingGravity.y || 0;
          const z = event.accelerationIncludingGravity.z || 0;
          setAcceleration({ x, y, z });
          success = true;
        }
      };

      const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
        if (event.gamma !== null && event.beta !== null) {
          const gamma = event.gamma || 0; // left/right tilt
          const beta = event.beta || 0;   // front/back tilt
          setAcceleration({ 
            x: gamma / 30, 
            y: beta / 30, 
            z: 0 
          });
          success = true;
        }
      };

      window.addEventListener('devicemotion', handleDeviceMotion, { passive: true });
      window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });
    };

    try {
      // For iOS 13+ devices - request permission
      if (typeof DeviceMotionEvent !== 'undefined' && 'requestPermission' in DeviceMotionEvent) {
        const motionPermission = await (DeviceMotionEvent as any).requestPermission();
        const orientationPermission = await (DeviceOrientationEvent as any).requestPermission();
        
        if (motionPermission === 'granted' || orientationPermission === 'granted') {
          setupAccelerometer();
        }
      } else {
        // For Android and older iOS - no permission needed
        setupAccelerometer();
      }
      
      // Wait a moment to see if we get data
      setTimeout(() => {
        if (success) {
          setMotionEnabled(true);
          setShowMotionButton(false);
        }
      }, 500);
      
    } catch (error) {
      console.log('Motion permission denied or not available');
    }
  };

  // Initialize balls
  useEffect(() => {
    const initialBalls: Ball[] = [];
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']; // coral, mint, sky blue, sage green

    // Add 333 regular balls
    for (let i = 0; i < 333; i++) {
      initialBalls.push({
        id: i,
        x: Math.random() * (window.innerWidth - 20),
        y: Math.random() * (window.innerHeight - 20),
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: 15, // uniform 15px balls (3x smaller)
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }



    setBalls(initialBalls);
  }, []);

  // Get color based on position (for mobile)
  const getPositionColor = (x: number, y: number, isLargeBall: boolean = false) => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Normalize position to 0-1 range
    const normalizedX = Math.max(0, Math.min(1, x / width));
    const normalizedY = Math.max(0, Math.min(1, y / height));
    
    // Define corner colors
    let topLeft, topRight, bottomLeft, bottomRight;
    
    if (isLargeBall) {
      // Color-blind friendly colors for large balls
      topLeft = [26, 26, 46]; // #1A1A2E - dark navy
      topRight = [114, 9, 183]; // #7209B7 - deep purple
      bottomLeft = [255, 107, 53]; // #FF6B35 - bright orange
      bottomRight = [22, 33, 62]; // #16213E - midnight blue
    } else {
      // Regular colors for small balls
      topLeft = [255, 107, 107]; // #FF6B6B - coral
      topRight = [78, 205, 196]; // #4ECDC4 - mint
      bottomLeft = [69, 183, 209]; // #45B7D1 - sky blue
      bottomRight = [150, 206, 180]; // #96CEB4 - sage green
    }
    
    // Bilinear interpolation between four corner colors
    const top = [
      topLeft[0] * (1 - normalizedX) + topRight[0] * normalizedX,
      topLeft[1] * (1 - normalizedX) + topRight[1] * normalizedX,
      topLeft[2] * (1 - normalizedX) + topRight[2] * normalizedX
    ];
    
    const bottom = [
      bottomLeft[0] * (1 - normalizedX) + bottomRight[0] * normalizedX,
      bottomLeft[1] * (1 - normalizedX) + bottomRight[1] * normalizedX,
      bottomLeft[2] * (1 - normalizedX) + bottomRight[2] * normalizedX
    ];
    
    const final = [
      Math.round(top[0] * (1 - normalizedY) + bottom[0] * normalizedY),
      Math.round(top[1] * (1 - normalizedY) + bottom[1] * normalizedY),
      Math.round(top[2] * (1 - normalizedY) + bottom[2] * normalizedY)
    ];
    
    return `rgb(${final[0]}, ${final[1]}, ${final[2]})`;
  };

  // Animation loop
  useEffect(() => {
    const animate = () => {
      setBalls(prevBalls => {
        // Create a copy of balls array to work with
        let updatedBalls = prevBalls.map(ball => ({
          ...ball,
          vx: ball.vx,
          vy: ball.vy
        }));

        // Apply physics forces first
        updatedBalls = updatedBalls.map(ball => {
          let newVx = ball.vx;
          let newVy = ball.vy;
          let newRotation = ball.rotation || 0;

          if (isMobile) {
            // Apply accelerometer forces (both axes reversed for natural sinking effect)
            newVx += acceleration.x * 0.1;
            newVy += acceleration.y * 0.1;
          } else {
            // Desktop: apply gravity
            newVy += 0.2;
          }

          // Update rotation for letters
          if (ball.isLetter) {
            newRotation += ball.rotationSpeed || 0;
          }

          return {
            ...ball,
            vx: newVx,
            vy: newVy,
            rotation: newRotation
          };
        });

        // Check ball-to-ball collisions
        for (let i = 0; i < updatedBalls.length; i++) {
          for (let j = i + 1; j < updatedBalls.length; j++) {
            const ball1 = updatedBalls[i];
            const ball2 = updatedBalls[j];
            
            const dx = (ball1.x + ball1.size / 2) - (ball2.x + ball2.size / 2);
            const dy = (ball1.y + ball1.size / 2) - (ball2.y + ball2.size / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = (ball1.size + ball2.size) / 2;

            if (distance < minDistance) {
              // Collision detected - calculate collision response
              const angle = Math.atan2(dy, dx);
              const sin = Math.sin(angle);
              const cos = Math.cos(angle);

              // Rotate velocities
              const vx1 = ball1.vx * cos + ball1.vy * sin;
              const vy1 = ball1.vy * cos - ball1.vx * sin;
              const vx2 = ball2.vx * cos + ball2.vy * sin;
              const vy2 = ball2.vy * cos - ball2.vx * sin;

              // Swap x velocities (elastic collision)
              const finalVx1 = vx2;
              const finalVx2 = vx1;

              // Rotate back and apply damping
              updatedBalls[i].vx = (finalVx1 * cos - vy1 * sin) * 0.9;
              updatedBalls[i].vy = (vy1 * cos + finalVx1 * sin) * 0.9;
              updatedBalls[j].vx = (finalVx2 * cos - vy2 * sin) * 0.9;
              updatedBalls[j].vy = (vy2 * cos + finalVx2 * sin) * 0.9;

              // Separate overlapping balls
              const overlap = minDistance - distance;
              const separationX = (dx / distance) * overlap * 0.5;
              const separationY = (dy / distance) * overlap * 0.5;
              
              updatedBalls[i].x += separationX;
              updatedBalls[i].y += separationY;
              updatedBalls[j].x -= separationX;
              updatedBalls[j].y -= separationY;
            }
          }
        }

        // Apply velocity and handle wall collisions
        return updatedBalls.map(ball => {
          let newX = ball.x + ball.vx;
          let newY = ball.y + ball.vy;
          let newVx = ball.vx;
          let newVy = ball.vy;
          let newColor = ball.color;

          // Bounce off edges
          if (newX <= 0 || newX >= window.innerWidth - ball.size) {
            newVx = -newVx * 0.8; // Add some damping
            newX = Math.max(0, Math.min(window.innerWidth - ball.size, newX));
          }
          if (newY <= 0 || newY >= window.innerHeight - ball.size) {
            newVy = -newVy * 0.8; // Add some damping
            newY = Math.max(0, Math.min(window.innerHeight - ball.size, newY));
          }

          // Update color based on position (mobile only) - only for small balls, not letters
          if (isMobile && !ball.isLetter) {
            newColor = getPositionColor(newX + ball.size / 2, newY + ball.size / 2, false);
          }

          return {
            ...ball,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            color: newColor
          };
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [acceleration, isMobile]);

  return (
    <div ref={containerRef} className="fixed inset-0 z-10">
      {balls.map(ball => (
        ball.isLetter ? (
          <div
            key={ball.id}
            className="absolute pointer-events-none font-xanman-wide font-bold flex items-center justify-center"
            style={{
              left: ball.x,
              top: ball.y,
              width: ball.size,
              height: ball.size,
              fontSize: `${ball.size * 0.8}px`,
              color: ball.color,
              transform: `rotate(${ball.rotation}deg)`,
              lineHeight: '1'
            }}
          >
            {ball.letter}
          </div>
        ) : (
          <div
            key={ball.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: ball.x,
              top: ball.y,
              width: ball.size,
              height: ball.size,
              backgroundColor: ball.color,
              transition: isMobile ? 'background-color 0.3s ease' : 'none'
            }}
          />
        )
      ))}
      
      {/* Motion enable button for mobile */}
      {showMotionButton && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <button
            onClick={enableMotion}
            className="bg-black text-white px-8 py-4 rounded-lg font-xanman-wide text-lg hover:bg-gray-800 transition-colors"
          >
            ENABLE MOTION
          </button>
        </div>
      )}
    </div>
  );
}