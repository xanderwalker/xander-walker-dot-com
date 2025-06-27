import { Link } from 'wouter';
import { useState, useEffect, useRef } from 'react';

export default function MonetPaint() {
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [deviceMotion, setDeviceMotion] = useState({ x: 0, y: 0, z: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [sensorEnabled, setSensorEnabled] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const backgroundRef = useRef<HTMLDivElement>(null);

  // Detect mobile and initialize background on component mount
  useEffect(() => {
    const checkMobile = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(checkMobile);
    
    if (backgroundRef.current) {
      // Desktop mouse properties
      backgroundRef.current.style.setProperty('--mouse-x', '50%');
      backgroundRef.current.style.setProperty('--mouse-y', '50%');
      
      // Mobile paint flow properties
      backgroundRef.current.style.setProperty('--flow-x', '50%');
      backgroundRef.current.style.setProperty('--flow-y', '50%');
      backgroundRef.current.style.setProperty('--flow-radius', '50%');
      backgroundRef.current.style.setProperty('--flow-angle', '0deg');
      backgroundRef.current.style.setProperty('--tilt-intensity', '0.3');
      
      // Legacy properties for compatibility
      backgroundRef.current.style.setProperty('--tilt-x', '50%');
      backgroundRef.current.style.setProperty('--tilt-y', '50%');
      backgroundRef.current.style.setProperty('--tilt-z', '50%');
    }
  }, []);

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

  // Function to request sensor permissions and enable motion
  const enableSensorMotion = async () => {
    if (!isMobile) return;

    try {
      // Request permission for device motion on iOS
      if (typeof DeviceMotionEvent !== 'undefined' && typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        const response = await (DeviceMotionEvent as any).requestPermission();
        if (response === 'granted') {
          setPermissionStatus('granted');
          setSensorEnabled(true);
        } else {
          setPermissionStatus('denied');
        }
      } else {
        // For Android and other devices
        setPermissionStatus('granted');
        setSensorEnabled(true);
      }
    } catch (error) {
      console.error('Error requesting device motion permission:', error);
      setPermissionStatus('denied');
    }
  };

  // Device motion for paint washing effect (mobile)
  useEffect(() => {
    if (!sensorEnabled || !isMobile) return;

    let lastUpdate = 0;
    const updateInterval = 100; // Update every 100ms for smoother transitions
    let smoothedTiltX = 0;
    let smoothedTiltY = 0;
    const smoothingFactor = 0.1; // Lower = more smoothing

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      const now = Date.now();
      if (now - lastUpdate < updateInterval) return; // Throttle updates
      lastUpdate = now;

      if (event.accelerationIncludingGravity) {
        // Get gravity-adjusted acceleration for tilt detection
        const x = (event.accelerationIncludingGravity.x || 0);
        const y = (event.accelerationIncludingGravity.y || 0);
        const z = (event.accelerationIncludingGravity.z || 0);
        
        // Calculate tilt angles (convert to degrees for easier understanding)
        const rawTiltX = Math.atan2(x, z) * (180 / Math.PI);
        const rawTiltY = Math.atan2(y, z) * (180 / Math.PI);
        
        // Apply smoothing to reduce jerkiness
        smoothedTiltX = smoothedTiltX + (rawTiltX - smoothedTiltX) * smoothingFactor;
        smoothedTiltY = smoothedTiltY + (rawTiltY - smoothedTiltY) * smoothingFactor;
        
        // Map tilt to paint flow positions (0-100%) with smaller range for subtlety
        const flowX = Math.max(20, Math.min(80, 50 + (smoothedTiltX * 0.8))); // ±24% range from center
        const flowY = Math.max(20, Math.min(80, 50 + (smoothedTiltY * 0.8))); // ±24% range from center
        
        // Create directional gradient based on tilt intensity
        const tiltIntensity = Math.sqrt(smoothedTiltX * smoothedTiltX + smoothedTiltY * smoothedTiltY);
        const flowRadius = Math.max(40, Math.min(80, tiltIntensity * 1.5 + 40)); // More responsive radius
        
        setDeviceMotion({ x: smoothedTiltX, y: smoothedTiltY, z: tiltIntensity });
        
        // Minimal debug logging for mobile testing
        if (tiltIntensity > 15 && Math.random() < 0.02) {
          console.log(`Paint flowing to: X: ${flowX.toFixed(1)}, Y: ${flowY.toFixed(1)}`);
        }
        
        // Update CSS custom properties for paint washing effect
        if (backgroundRef.current) {
          backgroundRef.current.style.setProperty('--flow-x', `${flowX}`);
          backgroundRef.current.style.setProperty('--flow-y', `${flowY}`);
          backgroundRef.current.style.setProperty('--flow-radius', `${flowRadius}px`);
          backgroundRef.current.style.setProperty('--tilt-intensity', `${Math.min(0.8, tiltIntensity / 50)}`);
          
          // Create dynamic gradient rotation based on tilt direction
          const gradientAngle = Math.atan2(smoothedTiltY, smoothedTiltX) * (180 / Math.PI);
          backgroundRef.current.style.setProperty('--flow-angle', `${gradientAngle}deg`);
        }
      }
    };

    window.addEventListener('devicemotion', handleDeviceMotion);
    return () => window.removeEventListener('devicemotion', handleDeviceMotion);
  }, [sensorEnabled, isMobile]);

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
      
      {/* Header with navigation back to projects */}
      <header className="p-8 flex justify-between items-center relative z-10">
        <Link href="/projects">
          <button className="text-white hover:text-gray-200 transition-colors text-lg backdrop-blur-sm bg-black/20 px-4 py-2 rounded-lg border border-white/20">
            ← BACK TO PROJECTS
          </button>
        </Link>
        
        <Link href="/">
          <h1 className="text-white font-xanman-wide font-bold text-4xl md:text-6xl hover:opacity-70 transition-opacity duration-200 cursor-pointer drop-shadow-lg">
            XANDER WALKER
          </h1>
        </Link>
        
        <div className="w-48"></div> {/* Spacer for center alignment */}
      </header>

      {/* Sensor activation button for mobile */}
      {isMobile && !sensorEnabled && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-30">
          <button
            onClick={enableSensorMotion}
            className="bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-lg border border-white/30 hover:bg-white/30 transition-all duration-300 shadow-lg"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Enable Motion Sensors
          </button>
        </div>
      )}

      {/* Sensor status indicator */}
      {isMobile && sensorEnabled && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-30">
          <div className="bg-green-500/20 backdrop-blur-md text-white px-4 py-2 rounded-lg border border-green-400/30 shadow-lg">
            <div style={{ fontFamily: 'Georgia, serif' }}>
              <div>Motion Sensors Active</div>
              {deviceMotion.z > 5 && (
                <div className="text-sm mt-1">
                  Tilt: {deviceMotion.x.toFixed(1)}°, {deviceMotion.y.toFixed(1)}° (Intensity: {deviceMotion.z.toFixed(1)})
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] space-y-12 px-8">
        
        {/* Title Card */}
        <div className="glassmorphism rounded-2xl p-12 text-center max-w-4xl">
          <h2 className="font-xanman-wide text-4xl md:text-6xl mb-6 text-black">
            MONET PAINT SWIRLING
          </h2>
          <p className="text-xl text-gray-700 mb-8 leading-relaxed" style={{fontFamily: 'Georgia, serif'}}>
            Interactive paint mixing inspired by Claude Monet's water lily paintings. 
            Move your mouse around the screen or tilt your mobile device to create 
            beautiful color gradients that blend and morph in real-time.
          </p>
          
          {/* Instructions */}
          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <div className="glassmorphism rounded-xl p-6">
              <h3 className="font-xanman-wide text-xl mb-4 text-black">DESKTOP</h3>
              <p className="text-gray-600" style={{fontFamily: 'Georgia, serif'}}>
                Move your mouse cursor around the screen to create dynamic paint swirls. 
                The colors will follow your movement, creating beautiful gradients that 
                blend and flow like watercolors on canvas.
              </p>
            </div>
            
            <div className="glassmorphism rounded-xl p-6">
              <h3 className="font-xanman-wide text-xl mb-4 text-black">MOBILE</h3>
              <p className="text-gray-600" style={{fontFamily: 'Georgia, serif'}}>
                {sensorEnabled || !isMobile
                  ? "Tilt and rotate your device to control the paint mixing. The accelerometer responds to your device's orientation, creating immersive color flows that react to your movements."
                  : "Tap the 'Enable Motion Sensors' button above to activate device tilt controls. Once enabled, tilt and rotate your device to control the paint mixing."
                }
              </p>
            </div>
          </div>
        </div>

        {/* Color Palette Reference */}
        <div className="glassmorphism rounded-2xl p-8 max-w-4xl w-full">
          <h3 className="font-xanman-wide text-2xl mb-6 text-center text-black">
            MONET COLOR PALETTE
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-full h-20 rounded-lg mb-2" style={{background: '#ff6b35'}}></div>
              <p className="text-sm" style={{fontFamily: 'Georgia, serif'}}>Sunset Orange</p>
            </div>
            <div className="text-center">
              <div className="w-full h-20 rounded-lg mb-2" style={{background: '#36c9dd'}}></div>
              <p className="text-sm" style={{fontFamily: 'Georgia, serif'}}>Water Lily Blue</p>
            </div>
            <div className="text-center">
              <div className="w-full h-20 rounded-lg mb-2" style={{background: '#22c55e'}}></div>
              <p className="text-sm" style={{fontFamily: 'Georgia, serif'}}>Garden Green</p>
            </div>
            <div className="text-center">
              <div className="w-full h-20 rounded-lg mb-2" style={{background: '#8b5cf6'}}></div>
              <p className="text-sm" style={{fontFamily: 'Georgia, serif'}}>Impressionist Purple</p>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="glassmorphism rounded-2xl p-8 max-w-4xl w-full">
          <h3 className="font-xanman-wide text-2xl mb-6 text-center text-black">
            TECHNICAL IMPLEMENTATION
          </h3>
          <div className="text-gray-700 space-y-4" style={{fontFamily: 'Georgia, serif'}}>
            <p>
              This interactive background uses CSS custom properties and multiple radial gradients 
              to create dynamic color mixing effects. The gradients respond to mouse position on 
              desktop and device accelerometer data on mobile devices.
            </p>
            <p>
              The color palette is inspired by Claude Monet's water lily series, featuring soft 
              blues, warm oranges, natural greens, and subtle purples that blend together like 
              watercolors bleeding into wet paper.
            </p>
            <p>
              Real-time position updates create smooth transitions between color states, 
              simulating the organic flow of paint mixing on canvas.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}