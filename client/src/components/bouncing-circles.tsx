import { useRef, useEffect, useState } from 'react';
import { useLocation } from 'wouter';

interface Circle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  text: string;
  action: () => void;
  isDragging?: boolean;
  dragStartX?: number;
  dragStartY?: number;
  dragStartTime?: number;
}

export default function BouncingCircles() {
  const [, setLocation] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [circles, setCircles] = useState<Circle[]>([]);
  const animationRef = useRef<number>();
  const [draggedCircle, setDraggedCircle] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [deviceOrientation, setDeviceOrientation] = useState({ x: 0, y: 0 });
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [showPermissionButton, setShowPermissionButton] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [accelerometerEnabled, setAccelerometerEnabled] = useState(false);

  const navigateToPage = (path: string) => {
    console.log('Navigating to:', path);
    setLocation(path);
  };

  const openExternal = (url: string) => {
    console.log('Opening external:', url);
    window.open(url, '_blank', 'noopener noreferrer');
  };

  useEffect(() => {
    const initialCircles: Circle[] = [
      {
        id: 'bio',
        x: Math.random() * (window.innerWidth - 320),
        y: Math.random() * (window.innerHeight - 320),
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: 320,
        color: 'bg-electric-orange',
        text: 'RESUME',
        action: () => navigateToPage('/about')
      },
      {
        id: 'projects',
        x: Math.random() * (window.innerWidth - 240),
        y: Math.random() * (window.innerHeight - 240),
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: 240,
        color: 'bg-cyan-blue',
        text: 'PROJECTS',
        action: () => navigateToPage('/projects')
      },
      {
        id: 'store',
        x: Math.random() * (window.innerWidth - 280),
        y: Math.random() * (window.innerHeight - 280),
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: 280,
        color: 'bg-electric-red',
        text: 'STORE',
        action: () => navigateToPage('/portfolio')
      },
      {
        id: 'contact',
        x: Math.random() * (window.innerWidth - 200),
        y: Math.random() * (window.innerHeight - 200),
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: 200,
        color: 'bg-neon-green',
        text: 'CONTACT',
        action: () => navigateToPage('/contact')
      }
    ];

    setCircles(initialCircles);

    const animate = () => {
      setCircles(prevCircles => 
        prevCircles.map(circle => {
          // Skip physics for dragged circles
          if (circle.isDragging) {
            return circle;
          }

          if (accelerometerEnabled && permissionGranted) {
            // ACCELEROMETER MODE: Direct gravity-based movement, preserve original velocities
            console.log('ACCEL MODE:', { 
              enabled: accelerometerEnabled, 
              granted: permissionGranted, 
              orientation: deviceOrientation,
              circleId: circle.id,
              currentPos: { x: circle.x, y: circle.y }
            });
            
            const gravity = 1.5;
            const moveX = deviceOrientation.x * gravity;
            const moveY = deviceOrientation.y * gravity;
            
            const newX = Math.max(0, Math.min(window.innerWidth - circle.size, circle.x + moveX));
            const newY = Math.max(0, Math.min(window.innerHeight - circle.size, circle.y + moveY));
            
            console.log('ACCEL MOVE:', { moveX, moveY, newX, newY });
            
            return {
              ...circle,
              x: newX,
              y: newY
              // Keep vx, vy unchanged so they restore when switching back
            };
          } else {
            // AUTO MODE: Standard bouncing physics
            let newX = circle.x + circle.vx;
            let newY = circle.y + circle.vy;
            let newVx = circle.vx;
            let newVy = circle.vy;

            // Bounce off edges
            if (newX <= 0 || newX >= window.innerWidth - circle.size) {
              newVx = -newVx * 0.8;
              newX = Math.max(0, Math.min(window.innerWidth - circle.size, newX));
            }
            if (newY <= 0 || newY >= window.innerHeight - circle.size) {
              newVy = -newVy * 0.8;
              newY = Math.max(0, Math.min(window.innerHeight - circle.size, newY));
            }

            return {
              ...circle,
              x: newX,
              y: newY,
              vx: newVx,
              vy: newVy
            };
          }
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
  }, [accelerometerEnabled, permissionGranted, deviceOrientation]);

  // Device orientation setup for mobile accelerometer
  useEffect(() => {
    // Check if we're on a mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileUA = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      console.log('Mobile detection:', { userAgent, isMobileUA, hasTouchScreen });
      return isMobileUA || hasTouchScreen;
    };
    
    const mobileDetected = checkMobile();
    setIsMobile(mobileDetected);
    console.log('Is mobile device:', mobileDetected);
    
    const requestPermission = async () => {
      console.log('Requesting device orientation permission...');
      console.log('DeviceOrientationEvent available:', typeof DeviceOrientationEvent !== 'undefined');
      console.log('Has requestPermission:', typeof DeviceOrientationEvent !== 'undefined' && 'requestPermission' in DeviceOrientationEvent);
      
      // Check if we're on a mobile device with DeviceOrientationEvent
      if (typeof DeviceOrientationEvent !== 'undefined' && 'requestPermission' in DeviceOrientationEvent) {
        console.log('iOS device detected - showing permission button');
        // iOS 13+ requires user interaction for permission request
        setShowPermissionButton(true);
      } else if (typeof DeviceOrientationEvent !== 'undefined') {
        console.log('Android/older iOS detected - setting up listener directly');
        // Android and older iOS don't require permission
        setPermissionGranted(true);
        setupOrientationListener();
        // Show toggle instead of permission button
        setShowPermissionButton(false);
      } else {
        console.log('DeviceOrientationEvent not supported');
      }
    };

    const setupOrientationListener = () => {
      const handleOrientation = (event: DeviceOrientationEvent) => {
        // Convert orientation to gravity-like forces
        // gamma: left/right tilt (-90 to 90)
        // beta: front/back tilt (-180 to 180)
        const x = event.gamma ? event.gamma / 90 : 0; // Normalize to -1 to 1
        const y = event.beta ? event.beta / 90 : 0;   // Normalize to -1 to 1
        
        setDeviceOrientation({ 
          x: Math.max(-1, Math.min(1, x)), 
          y: Math.max(-1, Math.min(1, y)) 
        });
      };

      window.addEventListener('deviceorientation', handleOrientation);
      
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
      };
    };

    // Add a small delay to ensure the component is mounted
    const timeoutId = setTimeout(requestPermission, 1000);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // Function to handle iOS permission request and toggle accelerometer
  const handlePermissionRequest = async () => {
    console.log('Permission button clicked');
    if (typeof DeviceOrientationEvent !== 'undefined' && 'requestPermission' in DeviceOrientationEvent) {
      try {
        console.log('Requesting DeviceOrientationEvent permission...');
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        console.log('Permission result:', permission);
        if (permission === 'granted') {
          console.log('Permission granted - setting up listener');
          setPermissionGranted(true);
          setShowPermissionButton(false);
          setAccelerometerEnabled(true);
          setupOrientationListener();
        } else {
          console.log('Permission denied');
        }
      } catch (error) {
        console.log('Permission request failed:', error);
      }
    }
  };

  // Function to toggle accelerometer on/off
  const toggleAccelerometer = () => {
    if (!permissionGranted) {
      handlePermissionRequest();
    } else {
      setAccelerometerEnabled(!accelerometerEnabled);
      console.log('Accelerometer toggled:', !accelerometerEnabled);
    }
  };

  // Set up orientation listener function
  const setupOrientationListener = () => {
    console.log('Setting up orientation listener...');
    
    const handleOrientation = (event: DeviceOrientationEvent) => {
      // Convert orientation to gravity-like forces
      // gamma: left/right tilt (-90 to 90)
      // beta: front/back tilt (-180 to 180)
      const x = event.gamma ? event.gamma / 90 : 0; // Normalize to -1 to 1
      const y = event.beta ? event.beta / 90 : 0;   // Normalize to -1 to 1
      
      const normalizedX = Math.max(-1, Math.min(1, x));
      const normalizedY = Math.max(-1, Math.min(1, y));
      
      // Only log significant orientation changes to avoid spam
      if (Math.abs(normalizedX) > 0.1 || Math.abs(normalizedY) > 0.1) {
        console.log('Orientation event:', { 
          gamma: event.gamma, 
          beta: event.beta, 
          normalizedX, 
          normalizedY 
        });
      }
      
      setDeviceOrientation({ 
        x: normalizedX, 
        y: normalizedY 
      });
    };

    window.addEventListener('deviceorientation', handleOrientation);
    console.log('Orientation listener added');
  };

  // Global mouse event listeners for dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!draggedCircle) return;
      
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      setMousePos({ x: mouseX, y: mouseY });
      
      setCircles(prev => prev.map(c => 
        c.id === draggedCircle 
          ? { 
              ...c, 
              x: Math.max(0, Math.min(window.innerWidth - c.size, mouseX - dragOffset.x)),
              y: Math.max(0, Math.min(window.innerHeight - c.size, mouseY - dragOffset.y)),
              vx: 0,
              vy: 0
            }
          : c
      ));
    };

    const handleGlobalMouseUp = () => {
      if (!draggedCircle) return;
      
      const circle = circles.find(c => c.id === draggedCircle);
      if (!circle) return;
      
      const dragDuration = Date.now() - (circle.dragStartTime || 0);
      const dragDistance = Math.sqrt(
        Math.pow((mousePos.x - (circle.dragStartX || 0)), 2) + 
        Math.pow((mousePos.y - (circle.dragStartY || 0)), 2)
      );
      
      // Apply throw velocity if dragged
      if (dragDuration >= 200 || dragDistance >= 5) {
        const throwMultiplier = 0.1;
        const deltaX = mousePos.x - (circle.dragStartX || 0);
        const deltaY = mousePos.y - (circle.dragStartY || 0);
        
        setCircles(prev => prev.map(c => 
          c.id === draggedCircle 
            ? { 
                ...c, 
                vx: deltaX * throwMultiplier,
                vy: deltaY * throwMultiplier,
                isDragging: false 
              }
            : c
        ));
      }
      
      setDraggedCircle(null);
      setCircles(prev => prev.map(c => ({ ...c, isDragging: false })));
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggedCircle, dragOffset, mousePos, circles]);

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent, circleId: string) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const circle = circles.find(c => c.id === circleId);
    if (!circle) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    setDraggedCircle(circleId);
    setDragOffset({
      x: mouseX - circle.x,
      y: mouseY - circle.y
    });
    setMousePos({ x: mouseX, y: mouseY });
    
    // Mark drag start time and position for click detection
    setCircles(prev => prev.map(c => 
      c.id === circleId 
        ? { ...c, isDragging: true, dragStartX: mouseX, dragStartY: mouseY, dragStartTime: Date.now() }
        : c
    ));
  };

  const handleClick = (circleId: string) => {
    const circle = circles.find(c => c.id === circleId);
    if (!circle || circle.isDragging) return;
    
    const dragDuration = Date.now() - (circle.dragStartTime || 0);
    const dragDistance = Math.sqrt(
      Math.pow((mousePos.x - (circle.dragStartX || 0)), 2) + 
      Math.pow((mousePos.y - (circle.dragStartY || 0)), 2)
    );
    
    // Only trigger action if it was a quick click
    if (dragDuration < 200 && dragDistance < 5) {
      console.log('Button clicked:', circleId);
      circle.action();
    }
  };

  return (
    <div ref={containerRef} className="fixed inset-0 z-30">
      {circles.map(circle => (
        <button
          key={circle.id}
          className={`absolute ${circle.color} rounded-full cursor-pointer flex items-center justify-center text-white font-xanman-wide hover:scale-110 transition-transform duration-200 uppercase border-0 outline-none opacity-70`}
          style={{
            left: circle.x,
            top: circle.y,
            width: circle.size,
            height: circle.size,
            fontSize: window.innerWidth < 768 ? '100px' : '80px',
            lineHeight: '1'
          }}
          onMouseDown={(e) => handleMouseDown(e, circle.id)}
          onClick={() => handleClick(circle.id)}
          type="button"
        >
          {circle.text}
        </button>
      ))}
      
      {/* iOS Permission Button */}
      {isMobile && showPermissionButton && (
        <button
          onClick={handlePermissionRequest}
          className="fixed bottom-4 right-4 bg-electric-orange text-white px-6 py-3 rounded-lg font-xanman-wide text-sm uppercase hover:bg-orange-600 transition-colors duration-200 z-50"
        >
          Enable Tilt Controls
        </button>
      )}
      
      {/* Accelerometer Toggle Switch */}
      {isMobile && permissionGranted && !showPermissionButton && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-black bg-opacity-80 text-white px-4 py-3 rounded-lg backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <span className="text-sm font-xanman-wide uppercase">
                {accelerometerEnabled ? 'Tilt Mode' : 'Auto Mode'}
              </span>
              <button
                onClick={toggleAccelerometer}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                  accelerometerEnabled ? 'bg-electric-orange' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
                    accelerometerEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            {accelerometerEnabled && (Math.abs(deviceOrientation.x) > 0.01 || Math.abs(deviceOrientation.y) > 0.01) && (
              <div className="text-xs mt-2 opacity-70">
                Tilt: {Math.round(deviceOrientation.x * 100)}, {Math.round(deviceOrientation.y * 100)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}