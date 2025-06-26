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
    const colors = ['#FF6B35', '#004E89', '#F7931E', '#06D6A0']; // red, blue, yellow, green

    for (let i = 0; i < 100; i++) {
      initialBalls.push({
        id: i,
        x: Math.random() * (window.innerWidth - 20),
        y: Math.random() * (window.innerHeight - 20),
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 15 + 5, // 5-20px balls
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    setBalls(initialBalls);
  }, []);

  // Get color based on position (for mobile)
  const getPositionColor = (x: number, y: number) => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Divide screen into quadrants
    const leftHalf = x < width / 2;
    const topHalf = y < height / 2;
    
    if (leftHalf && topHalf) return '#FF6B35'; // red - top left
    if (!leftHalf && topHalf) return '#004E89'; // blue - top right
    if (leftHalf && !topHalf) return '#F7931E'; // yellow - bottom left
    return '#06D6A0'; // green - bottom right
  };

  // Animation loop
  useEffect(() => {
    const animate = () => {
      setBalls(prevBalls => 
        prevBalls.map(ball => {
          let newVx = ball.vx;
          let newVy = ball.vy;
          let newX = ball.x;
          let newY = ball.y;
          let newColor = ball.color;

          if (isMobile) {
            // Apply accelerometer forces
            newVx += acceleration.x * 0.1;
            newVy += -acceleration.y * 0.1; // Invert Y for natural movement
          } else {
            // Desktop: apply gravity
            newVy += 0.2;
          }

          // Apply velocity
          newX += newVx;
          newY += newVy;

          // Bounce off edges
          if (newX <= 0 || newX >= window.innerWidth - ball.size) {
            newVx = -newVx * 0.8; // Add some damping
            newX = Math.max(0, Math.min(window.innerWidth - ball.size, newX));
          }
          if (newY <= 0 || newY >= window.innerHeight - ball.size) {
            newVy = -newVy * 0.8; // Add some damping
            newY = Math.max(0, Math.min(window.innerHeight - ball.size, newY));
          }

          // Update color based on position (mobile only)
          if (isMobile) {
            newColor = getPositionColor(newX + ball.size / 2, newY + ball.size / 2);
          }

          return {
            ...ball,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            color: newColor
          };
        })
      );

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
      
      {/* Instructions for mobile users */}
      {isMobile && (
        <div className="absolute top-20 left-4 right-4 text-center z-20">
          <div className="bg-black bg-opacity-50 text-white p-4 rounded-lg text-sm">
            Tilt your device to move the balls! They change color based on screen position.
          </div>
        </div>
      )}
    </div>
  );
}