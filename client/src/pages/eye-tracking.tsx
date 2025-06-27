import { useRef, useEffect, useState } from 'react';
import Layout from '@/components/layout';

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

  // Basic eye tracking using canvas pixel analysis
  const startEyeTracking = () => {
    const detectEyes = () => {
      if (!videoRef.current || !canvasRef.current) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx || video.videoWidth === 0) return;
      
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas for analysis
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data for analysis
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Simple eye detection approximation
      // This is a simplified version - real eye tracking would use ML models
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Simulate eye position based on face movement approximation
      let avgBrightness = 0;
      let darkSpots = [];
      
      // Sample key areas for dark spots (eyes)
      for (let y = Math.floor(centerY * 0.3); y < Math.floor(centerY * 0.7); y += 4) {
        for (let x = Math.floor(centerX * 0.2); x < Math.floor(centerX * 1.8); x += 4) {
          const i = (y * canvas.width + x) * 4;
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          avgBrightness += brightness;
          
          if (brightness < 80) { // Dark threshold for eyes
            darkSpots.push({ x, y, brightness });
          }
        }
      }
      
      // Find two darkest regions (approximate eye positions)
      darkSpots.sort((a, b) => a.brightness - b.brightness);
      
      let leftEyeX = centerX * 0.7;
      let leftEyeY = centerY * 0.8;
      let rightEyeX = centerX * 1.3;
      let rightEyeY = centerY * 0.8;
      
      if (darkSpots.length >= 2) {
        // Simple approximation of eye positions
        const eye1 = darkSpots[0];
        const eye2 = darkSpots[1];
        
        if (eye1.x < eye2.x) {
          leftEyeX = eye1.x;
          leftEyeY = eye1.y;
          rightEyeX = eye2.x;
          rightEyeY = eye2.y;
        } else {
          leftEyeX = eye2.x;
          leftEyeY = eye2.y;
          rightEyeX = eye1.x;
          rightEyeY = eye1.y;
        }
      }
      
      // Normalize positions to -1 to 1 range
      const normalizedLeftX = ((leftEyeX / canvas.width) - 0.5) * 2;
      const normalizedLeftY = ((leftEyeY / canvas.height) - 0.5) * 2;
      const normalizedRightX = ((rightEyeX / canvas.width) - 0.5) * 2;
      const normalizedRightY = ((rightEyeY / canvas.height) - 0.5) * 2;
      
      // Detect blinking (simplified - based on overall darkness in eye regions)
      const eyeRegionBrightness = avgBrightness / (darkSpots.length || 1);
      const isBlinking = eyeRegionBrightness < 50;
      
      setEyeData({
        leftEye: { 
          x: normalizedLeftX * 0.3, // Reduce sensitivity
          y: normalizedLeftY * 0.3,
          isOpen: !isBlinking 
        },
        rightEye: { 
          x: normalizedRightX * 0.3,
          y: normalizedRightY * 0.3,
          isOpen: !isBlinking 
        },
        isDetecting: true
      });
    };
    
    // Run detection every 100ms
    const interval = setInterval(detectEyes, 100);
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
    <Layout title="EYE TRACKING" subtitle="Real-time eye movement detection and mirroring">
      <div className="min-h-screen bg-black text-white p-8 font-serif">
        
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
                className="hidden" // Hidden canvas for image analysis
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
              
              {/* Left Eye - Inspired by user's sketch */}
              <div className="relative">
                <svg width="140" height="90" viewBox="0 0 140 90" className="drop-shadow-lg">
                  {/* Eye outline - more elongated like the sketch */}
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
                  
                  {/* Iris - larger and more prominent */}
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
                  
                  {/* Iris pattern */}
                  {eyeData.leftEye.isOpen && (
                    <circle 
                      cx={70 + (eyeData.leftEye.x * 18)} 
                      cy={45 + (eyeData.leftEye.y * 12)} 
                      r="18" 
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="0.5"
                      opacity="0.7"
                      className="transition-all duration-100"
                    />
                  )}
                  
                  {/* Pupil - more prominent */}
                  {eyeData.leftEye.isOpen && (
                    <circle 
                      cx={70 + (eyeData.leftEye.x * 18)} 
                      cy={45 + (eyeData.leftEye.y * 12)} 
                      r="10" 
                      fill="#1a1a1a"
                      className="transition-all duration-100"
                    />
                  )}
                  
                  {/* Highlight - sketch-like */}
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

              {/* Right Eye - Inspired by user's sketch */}
              <div className="relative">
                <svg width="140" height="90" viewBox="0 0 140 90" className="drop-shadow-lg">
                  {/* Eye outline - more elongated like the sketch */}
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
                  
                  {/* Iris - larger and more prominent */}
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
                  
                  {/* Iris pattern */}
                  {eyeData.rightEye.isOpen && (
                    <circle 
                      cx={70 + (eyeData.rightEye.x * 18)} 
                      cy={45 + (eyeData.rightEye.y * 12)} 
                      r="18" 
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="0.5"
                      opacity="0.7"
                      className="transition-all duration-100"
                    />
                  )}
                  
                  {/* Pupil - more prominent */}
                  {eyeData.rightEye.isOpen && (
                    <circle 
                      cx={70 + (eyeData.rightEye.x * 18)} 
                      cy={45 + (eyeData.rightEye.y * 12)} 
                      r="10" 
                      fill="#1a1a1a"
                      className="transition-all duration-100"
                    />
                  )}
                  
                  {/* Highlight - sketch-like */}
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
    </Layout>
  );
}