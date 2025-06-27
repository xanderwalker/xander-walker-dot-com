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

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const isMobileDevice = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Request accelerometer permission and setup listener for mobile
  useEffect(() => {
    if (!isMobile) return;

    let cleanup: (() => void) | undefined;

    const requestPermission = async () => {
      // Check for iOS 13+ permission system
      if (typeof DeviceOrientationEvent !== 'undefined' && 'requestPermission' in DeviceOrientationEvent) {
        try {
          const permission = await (DeviceOrientationEvent as any).requestPermission();
          if (permission === 'granted') {
            cleanup = setupAccelerometer();
          } else {
            console.log('Permission denied, trying without permission');
            cleanup = setupAccelerometer();
          }
        } catch (error) {
          console.log('Permission request failed, trying without permission');
          cleanup = setupAccelerometer();
        }
      } else {
        // For Android and older iOS devices
        cleanup = setupAccelerometer();
      }
    };

    const setupAccelerometer = () => {
      const handleDeviceMotion = (event: DeviceMotionEvent) => {
        const accel = event.accelerationIncludingGravity;
        if (accel && (accel.x !== null || accel.y !== null || accel.z !== null)) {
          setAcceleration({
            x: accel.x || 0,
            y: accel.y || 0,
            z: accel.z || 0
          });
        }
      };

      // Try to request permission first for iOS devices
      if (typeof DeviceMotionEvent !== 'undefined' && 'requestPermission' in DeviceMotionEvent) {
        (DeviceMotionEvent as any).requestPermission()
          .then((response: string) => {
            if (response === 'granted') {
              window.addEventListener('devicemotion', handleDeviceMotion, { passive: true });
            }
          })
          .catch(() => {
            // Fallback: add listener anyway
            window.addEventListener('devicemotion', handleDeviceMotion, { passive: true });
          });
      } else {
        // For non-iOS devices
        window.addEventListener('devicemotion', handleDeviceMotion, { passive: true });
      }

      return () => {
        window.removeEventListener('devicemotion', handleDeviceMotion);
      };
    };

    // Start immediately for better responsiveness
    requestPermission();

    return () => {
      if (cleanup) cleanup();
    };
  }, [isMobile]);

  // Initialize balls
  useEffect(() => {
    // Wait for window to be fully available
    const initializeBalls = () => {
      // Ensure we have valid window dimensions
      const width = typeof window !== 'undefined' ? (window.innerWidth || 800) : 800;
      const height = typeof window !== 'undefined' ? (window.innerHeight || 600) : 600;
      
      const initialBalls: Ball[] = [];
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']; // coral, mint, sky blue, sage green

      // Add 333 regular balls
      for (let i = 0; i < 333; i++) {
        const x = Math.random() * Math.max(width - 20, 100);
        const y = Math.random() * Math.max(height - 20, 100);
        
        initialBalls.push({
          id: i,
          x: isNaN(x) ? 100 : x,
          y: isNaN(y) ? 100 : y,
          vx: 0, // Start stationary - only move with accelerometer
          vy: 0, // Start stationary - only move with accelerometer
          size: 15, // uniform 15px balls (3x smaller)
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }

      // Add floating X and W letters
      const letters = ['X', 'W'];
      for (let i = 333; i < 335; i++) {
        const x = Math.random() * Math.max(width - 80, 100);
        const y = Math.random() * Math.max(height - 80, 100);
        
        initialBalls.push({
          id: i,
          x: isNaN(x) ? 100 : x,
          y: isNaN(y) ? 100 : y,
          vx: 0, // Start stationary - only move with accelerometer
          vy: 0, // Start stationary - only move with accelerometer
          size: 80, // Larger size for letters
          color: '#000000', // Black letters
          isLetter: true,
          letter: letters[i - 333],
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 8 // Random rotation speed
        });
      }

      setBalls(initialBalls);
    };

    // Small delay to ensure window is ready
    const timer = setTimeout(initializeBalls, 100);
    return () => clearTimeout(timer);
  }, []);

  // Get color based on position (for mobile)
  const getPositionColor = (x: number, y: number, isLargeBall: boolean = false) => {
    const width = window.innerWidth || 800;
    const height = window.innerHeight || 600;
    
    // Divide screen into quadrants
    const leftHalf = x < width / 2;
    const topHalf = y < height / 2;
    
    if (isLargeBall) {
      // Color-blind friendly colors for large balls - high contrast, distinct hues
      if (leftHalf && topHalf) return '#1A1A2E'; // dark navy - top left
      if (!leftHalf && topHalf) return '#7209B7'; // deep purple - top right
      if (leftHalf && !topHalf) return '#FF6B35'; // bright orange - bottom left
      return '#16213E'; // midnight blue - bottom right
    } else {
      // Regular colors for small balls
      if (leftHalf && topHalf) return '#FF6B6B'; // coral - top left
      if (!leftHalf && topHalf) return '#4ECDC4'; // mint - top right
      if (leftHalf && !topHalf) return '#45B7D1'; // sky blue - bottom left
      return '#96CEB4'; // sage green - bottom right
    }
  };

  // Animation loop
  useEffect(() => {
    const animate = () => {
      setBalls(prevBalls => {
        // Safety check: ensure we have valid balls
        if (!prevBalls.length) return prevBalls;
        
        // Create a copy of balls array to work with
        let updatedBalls = prevBalls.map(ball => ({
          ...ball,
          vx: ball.vx || 0,
          vy: ball.vy || 0,
          x: ball.x || 0,
          y: ball.y || 0
        }));

        // Apply physics forces first
        updatedBalls = updatedBalls.map(ball => {
          let newVx = ball.vx;
          let newVy = ball.vy;
          let newRotation = ball.rotation || 0;

          if (isMobile) {
            // Apply accelerometer forces ONLY
            newVx += acceleration.x * 0.1;
            newVy += -acceleration.y * 0.1; // Invert Y for natural movement
          }
          // No gravity or automatic movement on desktop

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

          // Use safe fallback values for window dimensions
          const width = window.innerWidth || 800;
          const height = window.innerHeight || 600;

          // Bounce off edges
          if (newX <= 0 || newX >= width - ball.size) {
            newVx = -newVx * 0.8; // Add some damping
            newX = Math.max(0, Math.min(width - ball.size, newX));
          }
          if (newY <= 0 || newY >= height - ball.size) {
            newVy = -newVy * 0.8; // Add some damping
            newY = Math.max(0, Math.min(height - ball.size, newY));
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
      {balls.filter(ball => !isNaN(ball.x) && !isNaN(ball.y) && !isNaN(ball.size)).map(ball => (
        ball.isLetter ? (
          <div
            key={ball.id}
            className="absolute pointer-events-none font-xanman-wide font-bold flex items-center justify-center border-2 border-black rounded-full"
            style={{
              left: `${ball.x}px`,
              top: `${ball.y}px`,
              width: `${ball.size}px`,
              height: `${ball.size}px`,
              fontSize: `${ball.size * 0.9}px`,
              color: ball.color,
              transform: `rotate(${ball.rotation || 0}deg)`,
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
              left: `${ball.x}px`,
              top: `${ball.y}px`,
              width: `${ball.size}px`,
              height: `${ball.size}px`,
              backgroundColor: ball.color,
              transition: isMobile ? 'background-color 0.3s ease' : 'none'
            }}
          />
        )
      ))}
    </div>
  );
}