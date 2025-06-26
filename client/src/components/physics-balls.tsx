import { useRef, useEffect, useState } from 'react';

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
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

    const requestPermission = async () => {
      if (typeof DeviceOrientationEvent !== 'undefined' && 'requestPermission' in DeviceOrientationEvent) {
        try {
          const permission = await (DeviceOrientationEvent as any).requestPermission();
          if (permission === 'granted') {
            setupAccelerometer();
          }
        } catch (error) {
          console.log('Permission request failed, trying without permission');
          setupAccelerometer();
        }
      } else {
        setupAccelerometer();
      }
    };

    const setupAccelerometer = () => {
      const handleDeviceMotion = (event: DeviceMotionEvent) => {
        if (event.accelerationIncludingGravity) {
          setAcceleration({
            x: event.accelerationIncludingGravity.x || 0,
            y: event.accelerationIncludingGravity.y || 0,
            z: event.accelerationIncludingGravity.z || 0
          });
        }
      };

      window.addEventListener('devicemotion', handleDeviceMotion);
      return () => window.removeEventListener('devicemotion', handleDeviceMotion);
    };

    // Add a small delay to ensure the page is loaded
    const timeout = setTimeout(requestPermission, 1000);
    return () => clearTimeout(timeout);
  }, [isMobile]);

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

    // Add 3 special large balls with opposite colors (dark/inverted colors)
    const oppositeColors = ['#004040', '#B31312', '#BA4801']; // dark teal, dark red, dark orange - opposites of mint/sky/coral
    for (let i = 333; i < 336; i++) {
      initialBalls.push({
        id: i,
        x: Math.random() * (window.innerWidth - 45),
        y: Math.random() * (window.innerHeight - 45),
        vx: (Math.random() - 0.5) * 1.5, // Slightly slower initial velocity
        vy: (Math.random() - 0.5) * 1.5,
        size: 45, // 3x larger (45px vs 15px)
        color: oppositeColors[i - 333] // cycle through opposite colors
      });
    }

    setBalls(initialBalls);
  }, []);

  // Get color based on position (for mobile)
  const getPositionColor = (x: number, y: number, isLargeBall: boolean = false) => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
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

          if (isMobile) {
            // Apply accelerometer forces
            newVx += acceleration.x * 0.1;
            newVy += -acceleration.y * 0.1; // Invert Y for natural movement
          } else {
            // Desktop: apply gravity
            newVy += 0.2;
          }

          return {
            ...ball,
            vx: newVx,
            vy: newVy
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

          // Update color based on position (mobile only) - different colors for large vs small balls
          if (isMobile) {
            const isLargeBall = ball.size === 45;
            newColor = getPositionColor(newX + ball.size / 2, newY + ball.size / 2, isLargeBall);
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
      ))}
      

    </div>
  );
}