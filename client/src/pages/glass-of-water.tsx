import { Link } from 'wouter';
import { useState, useEffect, useRef } from 'react';

interface WaterPoint {
  x: number;
  y: number;
  baseY: number;
  velocity: number;
}

export default function GlassOfWater() {
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [waterPoints, setWaterPoints] = useState<WaterPoint[]>([]);
  const [splashParticles, setSplashParticles] = useState<Array<{x: number, y: number, vx: number, vy: number, life: number}>>([]);
  const animationFrameRef = useRef<number>();

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

  // Initialize water surface points
  useEffect(() => {
    if (screenSize.width === 0 || screenSize.height === 0) return;

    const waterLevel = screenSize.height * 0.4; // Water takes up bottom 60% of screen
    const numPoints = Math.max(20, Math.floor(screenSize.width / 15)); // Adaptive resolution
    
    const points: WaterPoint[] = [];
    for (let i = 0; i <= numPoints; i++) {
      const x = (i / numPoints) * screenSize.width;
      points.push({
        x,
        y: waterLevel,
        baseY: waterLevel,
        velocity: 0
      });
    }
    
    setWaterPoints(points);
  }, [screenSize]);

  // Handle device motion (accelerometer)
  useEffect(() => {
    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity;
      if (acceleration && acceleration.x !== null && acceleration.y !== null) {
        setTilt({
          x: Math.max(-15, Math.min(15, acceleration.x || 0)),
          y: Math.max(-15, Math.min(15, acceleration.y || 0))
        });
      }
    };

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma !== null && event.beta !== null) {
        setTilt({
          x: Math.max(-45, Math.min(45, event.gamma)) / 3, // Scale to -15 to 15
          y: Math.max(-45, Math.min(45, event.beta)) / 3
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

  // Water physics animation
  useEffect(() => {
    const animate = () => {
      setWaterPoints(prevPoints => {
        return prevPoints.map((point, i) => {
          // Calculate target Y based on tilt and base water level
          const tiltOffset = (point.x - screenSize.width / 2) * (tilt.x * 0.002); // Horizontal tilt effect
          const targetY = point.baseY + tiltOffset + (tilt.y * 2); // Vertical tilt effect
          
          // Spring physics for water surface
          const force = (targetY - point.y) * 0.02; // Spring force
          const damping = 0.98; // Damping
          
          let newVelocity = (point.velocity + force) * damping;
          let newY = point.y + newVelocity;
          
          // Add wave propagation from neighbors
          if (i > 0 && i < prevPoints.length - 1) {
            const leftNeighbor = prevPoints[i - 1];
            const rightNeighbor = prevPoints[i + 1];
            const neighborForce = ((leftNeighbor.y + rightNeighbor.y) / 2 - point.y) * 0.015;
            newVelocity += neighborForce;
            newY += neighborForce;
          }
          
          return {
            ...point,
            y: newY,
            velocity: newVelocity
          };
        });
      });
      
      // Update splash particles
      setSplashParticles(prev => 
        prev.map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vy: particle.vy + 0.3, // Gravity
          life: particle.life - 0.02
        })).filter(particle => particle.life > 0)
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

  // Generate splash particles when tilt changes rapidly
  useEffect(() => {
    const tiltMagnitude = Math.sqrt(tilt.x * tilt.x + tilt.y * tilt.y);
    if (tiltMagnitude > 8 && Math.random() < 0.3) {
      const newSplashes: Array<{x: number, y: number, vx: number, vy: number, life: number}> = [];
      for (let i = 0; i < 5; i++) {
        newSplashes.push({
          x: Math.random() * screenSize.width,
          y: screenSize.height * (0.4 + Math.random() * 0.2),
          vx: (Math.random() - 0.5) * 10,
          vy: -Math.random() * 8,
          life: 1
        });
      }
      setSplashParticles(prev => [...prev, ...newSplashes]);
    }
  }, [tilt, screenSize]);

  // Generate water body path
  const generateWaterPath = () => {
    if (waterPoints.length === 0) return '';
    
    let path = `M 0 ${screenSize.height} `; // Start from bottom left
    path += `L 0 ${waterPoints[0].y} `; // Go to first water point
    
    // Create smooth curve through all water points
    for (let i = 0; i < waterPoints.length - 1; i++) {
      const current = waterPoints[i];
      const next = waterPoints[i + 1];
      const midX = (current.x + next.x) / 2;
      const midY = (current.y + next.y) / 2;
      
      if (i === 0) {
        path += `L ${current.x} ${current.y} `;
      }
      path += `Q ${current.x} ${current.y} ${midX} ${midY} `;
    }
    
    // Complete the water body
    const lastPoint = waterPoints[waterPoints.length - 1];
    path += `L ${lastPoint.x} ${lastPoint.y} `;
    path += `L ${screenSize.width} ${screenSize.height} `; // Bottom right
    path += `Z`; // Close path
    
    return path;
  };

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

      {/* Water Body */}
      <div className="absolute inset-0 w-full h-full">
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(100, 200, 255, 0.9)" />
              <stop offset="30%" stopColor="rgba(80, 180, 255, 0.8)" />
              <stop offset="70%" stopColor="rgba(60, 160, 255, 0.7)" />
              <stop offset="100%" stopColor="rgba(40, 140, 255, 0.6)" />
            </linearGradient>
            
            <filter id="waterFilter">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
              <feOffset dx="0" dy="2" result="offset" />
              <feFlood floodColor="rgba(0, 100, 200, 0.3)" />
              <feComposite in2="offset" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* Main water body */}
          <path
            d={generateWaterPath()}
            fill="url(#waterGradient)"
            filter="url(#waterFilter)"
            style={{ transition: 'none' }}
          />
          
          {/* Water surface reflection */}
          <path
            d={waterPoints.length > 0 ? `M 0 ${waterPoints[0].y} ${waterPoints.map(p => `L ${p.x} ${p.y}`).join(' ')} L ${screenSize.width} ${waterPoints[waterPoints.length - 1]?.y || 0}` : ''}
            fill="none"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="2"
            style={{ transition: 'none' }}
          />
        </svg>
        
        {/* Splash particles */}
        {splashParticles.map((particle, index) => (
          <div
            key={index}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: '6px',
              height: '6px',
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              backgroundColor: `rgba(100, 200, 255, ${particle.life * 0.8})`,
              transform: 'translate(-50%, -50%)',
              zIndex: 2
            }}
          />
        ))}
      </div>

      {/* Tilt Indicator */}
      <div className="absolute bottom-8 left-8 z-10 bg-black bg-opacity-20 rounded-lg p-4 font-xanman-wide text-black">
        <div className="text-sm">TILT: {tilt.x.toFixed(1)}, {tilt.y.toFixed(1)}</div>
        <div className="text-xs mt-1">POINTS: {waterPoints.length}</div>
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