import { Link } from 'wouter';
import { useState, useEffect, useRef } from 'react';

export default function MonetPaint() {
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [deviceMotion, setDeviceMotion] = useState({ x: 0, y: 0, z: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const backgroundRef = useRef<HTMLDivElement>(null);

  // Detect mobile and initialize background on component mount
  useEffect(() => {
    const checkMobile = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(checkMobile);
    
    if (backgroundRef.current) {
      backgroundRef.current.style.setProperty('--mouse-x', '50%');
      backgroundRef.current.style.setProperty('--mouse-y', '50%');
      backgroundRef.current.style.setProperty('--tilt-x', '50%');
      backgroundRef.current.style.setProperty('--tilt-y', '50%');
      backgroundRef.current.style.setProperty('--tilt-z', '50%');
      
      // Force background update for mobile
      if (checkMobile) {
        setTimeout(() => {
          if (backgroundRef.current) {
            backgroundRef.current.style.background = `
              radial-gradient(circle at 50% 50%, #2e4c8b 0%, #4a6bb5 15%, #6b8dd6 30%, transparent 50%),
              radial-gradient(circle at 70% 30%, #5d4a8a 0%, #7a6ba0 20%, #9d8cb6 40%, transparent 60%),
              radial-gradient(circle at 25% 85%, #8fa9e5 0%, #b5c6f2 25%, #c8b5d4 50%, transparent 70%),
              linear-gradient(135deg, #2e4c8b, #5d4a8a, #8fa9e5, #c8b5d4, #d4c2a8, #a8b5a0)
            `;
          }
        }, 100);
      }
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

  // Device motion for paint swirling (mobile)
  useEffect(() => {
    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      if (event.accelerationIncludingGravity) {
        const x = Math.max(-50, Math.min(50, (event.accelerationIncludingGravity.x || 0) * 5));
        const y = Math.max(-50, Math.min(50, (event.accelerationIncludingGravity.y || 0) * 5));
        const z = Math.max(-50, Math.min(50, (event.accelerationIncludingGravity.z || 0) * 5));
        
        setDeviceMotion({ x, y, z });
        
        // Update CSS custom properties for paint swirling
        if (backgroundRef.current) {
          backgroundRef.current.style.setProperty('--tilt-x', `${x + 50}%`);
          backgroundRef.current.style.setProperty('--tilt-y', `${y + 50}%`);
          backgroundRef.current.style.setProperty('--tilt-z', `${z + 50}%`);
        }
      }
    };

    if (isMobile) {
      // Request permission for device motion on iOS
      if (typeof DeviceMotionEvent !== 'undefined' && typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        (DeviceMotionEvent as any).requestPermission().then((response: string) => {
          if (response === 'granted') {
            window.addEventListener('devicemotion', handleDeviceMotion);
          }
        });
      } else {
        window.addEventListener('devicemotion', handleDeviceMotion);
      }
    }

    return () => window.removeEventListener('devicemotion', handleDeviceMotion);
  }, [isMobile]); // Depend on isMobile to ensure it runs after mobile detection

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
                Tilt and rotate your device to control the paint mixing. 
                The accelerometer responds to your device's orientation, 
                creating immersive color flows that react to your movements.
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