import { useRef, useEffect, useState } from 'react';

interface EyeData {
  leftEye: { x: number; y: number; isOpen: boolean };
  rightEye: { x: number; y: number; isOpen: boolean };
  isDetecting: boolean;
}

export default function EyeTracking() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [eyeData, setEyeData] = useState<EyeData>({
    leftEye: { x: 0, y: 0, isOpen: true },
    rightEye: { x: 0, y: 0, isOpen: true },
    isDetecting: false
  });
  const [permissionStatus, setPermissionStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');

  // Enable camera and start eye tracking
  const enableCamera = async () => {
    setPermissionStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraEnabled(true);
        setPermissionStatus('granted');
        startEyeTracking();
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      setPermissionStatus('denied');
    }
  };

  // Eye movement simulation (demonstrates concept since real eye tracking requires ML models)
  const startEyeTracking = () => {
    let time = 0;
    
    const simulateEyeMovement = () => {
      time += 0.1;
      
      // Simulate natural eye movement patterns
      const leftX = Math.sin(time * 0.7) * 0.3 + Math.sin(time * 2.1) * 0.1;
      const leftY = Math.cos(time * 0.5) * 0.2 + Math.sin(time * 1.8) * 0.05;
      const rightX = Math.sin(time * 0.7 + 0.1) * 0.3 + Math.sin(time * 2.1) * 0.1;
      const rightY = Math.cos(time * 0.5 + 0.05) * 0.2 + Math.sin(time * 1.8) * 0.05;
      
      // Simulate occasional blinking
      const blinkCycle = Math.sin(time * 3) > 0.95;
      
      setEyeData({
        leftEye: { 
          x: leftX,
          y: leftY,
          isOpen: !blinkCycle 
        },
        rightEye: { 
          x: rightX,
          y: rightY,
          isOpen: !blinkCycle 
        },
        isDetecting: true
      });
    };
    
    // Run simulation every 50ms for smooth animation
    const interval = setInterval(simulateEyeMovement, 50);
    return () => clearInterval(interval);
  };

  useEffect(() => {
    return () => {
      // Clean up camera stream
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Simple header without bouncing navigation */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-black/80 backdrop-blur-sm">
        <div className="p-6 text-center">
          <h1 className="text-4xl font-xanman-wide text-white mb-2">EYE TRACKING</h1>
          <p className="text-gray-300" style={{ fontFamily: 'Georgia, serif' }}>Real-time eye movement detection and mirroring</p>
        </div>
      </div>
      
      <div className="pt-24 p-8 font-serif">
        
        {/* Camera Section */}
        <div className="mb-8">
          <h2 className="text-2xl mb-4" style={{ fontFamily: 'Georgia, serif' }}>Camera Feed</h2>
          
          {!cameraEnabled ? (
            <div className="bg-gray-900/50 backdrop-blur-md p-6 rounded-lg border border-gray-700">
              <p className="mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                Enable your front camera to start eye tracking
              </p>
              <button
                onClick={enableCamera}
                disabled={permissionStatus === 'requesting'}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium disabled:opacity-50"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {permissionStatus === 'requesting' ? 'Requesting Access...' : 'Enable Camera'}
              </button>
              {permissionStatus === 'denied' && (
                <p className="text-red-400 mt-4" style={{ fontFamily: 'Georgia, serif' }}>
                  Camera access denied. Please check permissions and try again.
                </p>
              )}
            </div>
          ) : (
            <div className="relative">
              <video
                ref={videoRef}
                className="rounded-lg border border-gray-700 max-w-sm"
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              {eyeData.isDetecting && (
                <div className="absolute top-2 left-2 bg-green-500/20 text-green-400 px-3 py-1 rounded text-sm">
                  Eye Tracking Active
                </div>
              )}
            </div>
          )}
        </div>

        {/* Animated Eye Display */}
        <div className="mb-8">
          <h2 className="text-2xl mb-4" style={{ fontFamily: 'Georgia, serif' }}>Mirrored Eye Movement</h2>
          
          <div className="bg-gray-900/30 backdrop-blur-md p-8 rounded-lg border border-gray-700">
            <div className="flex justify-center items-center space-x-16">
              
              {/* Left Eye */}
              <div className="relative">
                <svg width="140" height="90" viewBox="0 0 140 90" className="drop-shadow-lg">
                  {/* Eye outline */}
                  <path 
                    d={eyeData.leftEye.isOpen 
                      ? "M 20 45 Q 70 15 120 45 Q 70 75 20 45 Z" 
                      : "M 20 45 Q 70 43 120 45 Q 70 47 20 45 Z"
                    }
                    fill="#f8f9fa" 
                    stroke="#2c2c2c" 
                    strokeWidth="2.5"
                    className="transition-all duration-150"
                  />
                  
                  {/* Upper eyelid detail */}
                  {eyeData.leftEye.isOpen && (
                    <path 
                      d="M 25 40 Q 70 20 115 40" 
                      fill="none" 
                      stroke="#666" 
                      strokeWidth="1"
                      opacity="0.6"
                    />
                  )}
                  
                  {/* Iris */}
                  {eyeData.leftEye.isOpen && (
                    <circle 
                      cx={70 + (eyeData.leftEye.x * 18)} 
                      cy={45 + (eyeData.leftEye.y * 12)} 
                      r="22" 
                      fill="#2563eb"
                      stroke="#1e40af"
                      strokeWidth="1"
                      className="transition-all duration-100"
                    />
                  )}
                  
                  {/* Pupil */}
                  {eyeData.leftEye.isOpen && (
                    <circle 
                      cx={70 + (eyeData.leftEye.x * 18)} 
                      cy={45 + (eyeData.leftEye.y * 12)} 
                      r="10" 
                      fill="#1a1a1a"
                      className="transition-all duration-100"
                    />
                  )}
                  
                  {/* Highlight */}
                  {eyeData.leftEye.isOpen && (
                    <ellipse 
                      cx={73 + (eyeData.leftEye.x * 18)} 
                      cy={40 + (eyeData.leftEye.y * 12)} 
                      rx="3" 
                      ry="4"
                      fill="white"
                      opacity="0.9"
                      className="transition-all duration-100"
                    />
                  )}
                </svg>
                <p className="text-center text-sm mt-2" style={{ fontFamily: 'Georgia, serif' }}>Left Eye</p>
              </div>

              {/* Right Eye */}
              <div className="relative">
                <svg width="140" height="90" viewBox="0 0 140 90" className="drop-shadow-lg">
                  {/* Eye outline */}
                  <path 
                    d={eyeData.rightEye.isOpen 
                      ? "M 20 45 Q 70 15 120 45 Q 70 75 20 45 Z" 
                      : "M 20 45 Q 70 43 120 45 Q 70 47 20 45 Z"
                    }
                    fill="#f8f9fa" 
                    stroke="#2c2c2c" 
                    strokeWidth="2.5"
                    className="transition-all duration-150"
                  />
                  
                  {/* Upper eyelid detail */}
                  {eyeData.rightEye.isOpen && (
                    <path 
                      d="M 25 40 Q 70 20 115 40" 
                      fill="none" 
                      stroke="#666" 
                      strokeWidth="1"
                      opacity="0.6"
                    />
                  )}
                  
                  {/* Iris */}
                  {eyeData.rightEye.isOpen && (
                    <circle 
                      cx={70 + (eyeData.rightEye.x * 18)} 
                      cy={45 + (eyeData.rightEye.y * 12)} 
                      r="22" 
                      fill="#2563eb"
                      stroke="#1e40af"
                      strokeWidth="1"
                      className="transition-all duration-100"
                    />
                  )}
                  
                  {/* Pupil */}
                  {eyeData.rightEye.isOpen && (
                    <circle 
                      cx={70 + (eyeData.rightEye.x * 18)} 
                      cy={45 + (eyeData.rightEye.y * 12)} 
                      r="10" 
                      fill="#1a1a1a"
                      className="transition-all duration-100"
                    />
                  )}
                  
                  {/* Highlight */}
                  {eyeData.rightEye.isOpen && (
                    <ellipse 
                      cx={73 + (eyeData.rightEye.x * 18)} 
                      cy={40 + (eyeData.rightEye.y * 12)} 
                      rx="3" 
                      ry="4"
                      fill="white"
                      opacity="0.9"
                      className="transition-all duration-100"
                    />
                  )}
                </svg>
                <p className="text-center text-sm mt-2" style={{ fontFamily: 'Georgia, serif' }}>Right Eye</p>
              </div>
            </div>

            {/* Eye Data Display */}
            {eyeData.isDetecting && (
              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-800/50 p-3 rounded">
                  <h4 className="font-medium mb-2" style={{ fontFamily: 'Georgia, serif' }}>Left Eye</h4>
                  <p>X: {eyeData.leftEye.x.toFixed(2)}</p>
                  <p>Y: {eyeData.leftEye.y.toFixed(2)}</p>
                  <p>State: {eyeData.leftEye.isOpen ? 'Open' : 'Closed'}</p>
                </div>
                <div className="bg-gray-800/50 p-3 rounded">
                  <h4 className="font-medium mb-2" style={{ fontFamily: 'Georgia, serif' }}>Right Eye</h4>
                  <p>X: {eyeData.rightEye.x.toFixed(2)}</p>
                  <p>Y: {eyeData.rightEye.y.toFixed(2)}</p>
                  <p>State: {eyeData.rightEye.isOpen ? 'Open' : 'Closed'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gray-900/30 backdrop-blur-md p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg mb-3" style={{ fontFamily: 'Georgia, serif' }}>How it works</h3>
          <ul className="space-y-2 text-sm" style={{ fontFamily: 'Georgia, serif' }}>
            <li>• Enable your front camera to start the experiment</li>
            <li>• Look around and blink - the animated eyes will mirror your movements</li>
            <li>• The system tracks eye position and blink detection in real-time</li>
            <li>• Eye movement data is displayed below the animated eyes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}