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
  const [accelerometerEnabled, setAccelerometerEnabled] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
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

    const waterLevel = screenSize.height * 0.6; // Water surface at 60% down from top (40% from bottom)
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
    if (!accelerometerEnabled) return;

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

    window.addEventListener('devicemotion', handleDeviceMotion);
    window.addEventListener('deviceorientation', handleDeviceOrientation);

    return () => {
      window.removeEventListener('devicemotion', handleDeviceMotion);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, [accelerometerEnabled]);

  // Permission handler
  const requestAccelerometerPermission = async () => {
    try {
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission === 'granted') {
          setPermissionGranted(true);
          setAccelerometerEnabled(true);
        } else {
          setPermissionGranted(false);
        }
      } else {
        // For Android and other devices
        setPermissionGranted(true);
        setAccelerometerEnabled(true);
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      setPermissionGranted(false);
    }
  };

  // Water physics animation with enhanced curves
  useEffect(() => {
    const animate = () => {
      setWaterPoints(prevPoints => {
        return prevPoints.map((point, i) => {
          // Calculate target Y based on tilt and base water level with more dramatic curves
          const distanceFromCenter = (point.x - screenSize.width / 2) / (screenSize.width / 2);
          const tiltOffset = distanceFromCenter * (-tilt.x * 0.02); // Inverted: water flows toward tilt direction
          const targetY = point.baseY + tiltOffset + (-tilt.y * 8); // Inverted: water moves with tilt
          
          // Spring physics for water surface with stronger forces
          const force = (targetY - point.y) * 0.03; // Increased spring force
          const damping = 0.96; // Less damping for more fluid motion
          
          let newVelocity = (point.velocity + force) * damping;
          let newY = point.y + newVelocity;
          
          // Enhanced wave propagation with more neighbors for smoother curves
          if (i > 1 && i < prevPoints.length - 2) {
            const leftNeighbor = prevPoints[i - 1];
            const rightNeighbor = prevPoints[i + 1];
            const leftLeft = prevPoints[i - 2];
            const rightRight = prevPoints[i + 2];
            
            // Weighted average including second neighbors for smoother curves
            const neighborAvg = (leftLeft.y * 0.1 + leftNeighbor.y * 0.4 + rightNeighbor.y * 0.4 + rightRight.y * 0.1);
            const neighborForce = (neighborAvg - point.y) * 0.025; // Increased neighbor influence
            newVelocity += neighborForce;
            newY += neighborForce;
          } else if (i > 0 && i < prevPoints.length - 1) {
            // Standard neighbor calculation for edge points
            const leftNeighbor = prevPoints[i - 1];
            const rightNeighbor = prevPoints[i + 1];
            const neighborForce = ((leftNeighbor.y + rightNeighbor.y) / 2 - point.y) * 0.02;
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

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [screenSize, tilt]);

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
      </div>

      {/* Accelerometer Permission Toggle */}
      <div className="absolute top-20 right-8 z-10">
        <button
          onClick={accelerometerEnabled ? () => setAccelerometerEnabled(false) : requestAccelerometerPermission}
          className={`font-xanman-wide px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            accelerometerEnabled 
              ? 'bg-green-500 text-white hover:bg-green-600' 
              : 'bg-gray-500 text-white hover:bg-gray-600'
          }`}
        >
          {accelerometerEnabled ? 'ACCELEROMETER ON' : 'ENABLE ACCELEROMETER'}
        </button>
      </div>

      {/* Tilt Indicator */}
      <div className="absolute bottom-8 left-8 z-10 bg-black bg-opacity-20 rounded-lg p-4 font-xanman-wide text-black">
        <div className="text-sm">TILT: {tilt.x.toFixed(1)}, {tilt.y.toFixed(1)}</div>
        <div className="text-xs mt-1">POINTS: {waterPoints.length}</div>
        <div className="text-xs">ACCEL: {accelerometerEnabled ? 'ON' : 'OFF'}</div>
      </div>

      {/* Instructions and Test Controls */}
      <div className="absolute bottom-8 right-8 z-10 bg-black bg-opacity-20 rounded-lg p-4 font-xanman-wide text-black text-right">
        <div className="text-sm">
          {accelerometerEnabled ? 'TILT YOUR DEVICE' : 'ENABLE ACCELEROMETER'}
        </div>
        <div className="text-xs mt-1 mb-2">
          {accelerometerEnabled ? 'TO SLOSH THE WATER' : 'TO START SLOSHING'}
        </div>
        
        {/* Desktop Test Controls */}
        <div className="text-xs">
          <div>DESKTOP TEST:</div>
          <div className="flex gap-2 mt-1">
            <button 
              className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
              onMouseDown={() => setTilt({x: -10, y: 0})}
              onMouseUp={() => setTilt({x: 0, y: 0})}
            >
              ←
            </button>
            <button 
              className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
              onMouseDown={() => setTilt({x: 10, y: 0})}
              onMouseUp={() => setTilt({x: 0, y: 0})}
            >
              →
            </button>
            <button 
              className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
              onMouseDown={() => setTilt({x: 0, y: -10})}
              onMouseUp={() => setTilt({x: 0, y: 0})}
            >
              ↑
            </button>
            <button 
              className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
              onMouseDown={() => setTilt({x: 0, y: 10})}
              onMouseUp={() => setTilt({x: 0, y: 0})}
            >
              ↓
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}