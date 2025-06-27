import { Link } from 'wouter';
import { useState, useEffect, useRef } from 'react';

interface WaterParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

export default function GlassOfWater() {
  const [waterParticles, setWaterParticles] = useState<WaterParticle[]>([]);
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();
  const particleIdRef = useRef(0);

  // Update screen size
  useEffect(() => {
    const updateScreenSize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  // Initialize water particles to fill 60% of screen volume
  useEffect(() => {
    if (screenSize.width === 0 || screenSize.height === 0) return;

    const targetVolume = screenSize.width * screenSize.height * 0.6;
    const particleSize = Math.max(8, Math.min(16, Math.sqrt(targetVolume / 1000))); // Adaptive particle size
    const particleArea = Math.PI * Math.pow(particleSize / 2, 2);
    const numParticles = Math.floor(targetVolume / particleArea);

    const particles: WaterParticle[] = [];
    
    // Create particles in a water-like distribution (bottom 60% of screen)
    for (let i = 0; i < numParticles; i++) {
      const waterHeight = screenSize.height * 0.6;
      const x = Math.random() * screenSize.width;
      const y = screenSize.height - (Math.random() * waterHeight);
      
      particles.push({
        id: particleIdRef.current++,
        x,
        y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: particleSize * (0.8 + Math.random() * 0.4)
      });
    }

    setWaterParticles(particles);
  }, [screenSize]);

  // Handle device motion (accelerometer)
  useEffect(() => {
    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity;
      if (acceleration && acceleration.x !== null && acceleration.y !== null) {
        setTilt({
          x: Math.max(-10, Math.min(10, acceleration.x || 0)),
          y: Math.max(-10, Math.min(10, acceleration.y || 0))
        });
      }
    };

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma !== null && event.beta !== null) {
        setTilt({
          x: Math.max(-45, Math.min(45, event.gamma)) / 4.5, // Scale to -10 to 10
          y: Math.max(-45, Math.min(45, event.beta)) / 4.5
        });
      }
    };

    // Request permission for iOS devices
    const requestPermission = async () => {
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission === 'granted') {
          window.addEventListener('devicemotion', handleDeviceMotion);
          window.addEventListener('deviceorientation', handleDeviceOrientation);
        }
      } else {
        // For Android and other devices
        window.addEventListener('devicemotion', handleDeviceMotion);
        window.addEventListener('deviceorientation', handleDeviceOrientation);
      }
    };

    requestPermission();

    return () => {
      window.removeEventListener('devicemotion', handleDeviceMotion);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, []);

  // Physics animation loop
  useEffect(() => {
    const animate = () => {
      setWaterParticles(prevParticles => 
        prevParticles.map(particle => {
          let newX = particle.x + particle.vx;
          let newY = particle.y + particle.vy;
          let newVx = particle.vx;
          let newVy = particle.vy;

          // Apply gravity and tilt forces
          const gravity = 0.3;
          const tiltForceX = tilt.x * 0.1;
          const tiltForceY = -tilt.y * 0.1; // Negative because screen Y is inverted

          newVx += tiltForceX;
          newVy += gravity + tiltForceY;

          // Damping
          newVx *= 0.98;
          newVy *= 0.98;

          // Boundary collisions
          const radius = particle.size / 2;
          
          if (newX <= radius) {
            newX = radius;
            newVx = -newVx * 0.6;
          }
          if (newX >= screenSize.width - radius) {
            newX = screenSize.width - radius;
            newVx = -newVx * 0.6;
          }
          if (newY <= radius) {
            newY = radius;
            newVy = -newVy * 0.6;
          }
          if (newY >= screenSize.height - radius) {
            newY = screenSize.height - radius;
            newVy = -newVy * 0.6;
          }

          // Simple particle-to-particle collision (proximity-based)
          const otherParticles = prevParticles.filter(p => p.id !== particle.id);
          for (const other of otherParticles) {
            const dx = newX - other.x;
            const dy = newY - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = (particle.size + other.size) / 2;

            if (distance < minDistance && distance > 0) {
              const overlap = minDistance - distance;
              const angle = Math.atan2(dy, dx);
              
              newX += Math.cos(angle) * overlap * 0.5;
              newY += Math.sin(angle) * overlap * 0.5;
              
              const force = 0.5;
              newVx += Math.cos(angle) * force;
              newVy += Math.sin(angle) * force;
            }
          }

          return {
            ...particle,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy
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
  }, [screenSize, tilt]);

  return (
    <div className="min-h-screen bg-white text-black overflow-hidden relative">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 p-8 flex justify-between items-center">
        <Link href="/projects">
          <button className="text-black hover:text-gray-600 transition-colors text-lg font-xanman-wide">
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

      {/* Water Particles */}
      <div className="absolute inset-0 w-full h-full">
        {waterParticles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full transition-none"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: `${particle.x - particle.size/2}px`,
              top: `${particle.y - particle.size/2}px`,
              background: `radial-gradient(circle at 30% 30%, 
                rgba(100, 200, 255, 0.8), 
                rgba(50, 150, 255, 0.6), 
                rgba(0, 100, 200, 0.4))`,
              boxShadow: '0 2px 8px rgba(0, 100, 200, 0.3)',
              zIndex: 1
            }}
          />
        ))}
      </div>

      {/* Tilt Indicator */}
      <div className="absolute bottom-8 left-8 z-10 bg-black bg-opacity-20 rounded-lg p-4 font-xanman-wide text-black">
        <div className="text-sm">TILT: {tilt.x.toFixed(1)}, {tilt.y.toFixed(1)}</div>
        <div className="text-xs mt-1">PARTICLES: {waterParticles.length}</div>
        <div className="text-xs">SCREEN: {screenSize.width}×{screenSize.height}</div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-8 right-8 z-10 bg-black bg-opacity-20 rounded-lg p-4 font-xanman-wide text-black text-right">
        <div className="text-sm">TILT YOUR DEVICE</div>
        <div className="text-xs mt-1">TO SLOSH THE WATER</div>
      </div>
    </div>
  );
}