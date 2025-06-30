import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CameraDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
  facing: 'user' | 'environment' | 'unknown';
}

interface CapturedPhoto {
  id: number;
  imageData: string;
  timestamp: number;
}

export default function CameraOptimal() {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<CameraDevice | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [finalCollage, setFinalCollage] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showViewfinder, setShowViewfinder] = useState(false);
  const [isCapturingSequence, setIsCapturingSequence] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();
  
  const saveSubmissionMutation = useMutation({
    mutationFn: async (data: { imageData: string; flowerCount: number }) => {
      const response = await fetch('/api/kaleidoscope-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save submission');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setSaveStatus('saved');
      queryClient.invalidateQueries({ queryKey: ['/api/kaleidoscope-submissions'] });
    },
    onError: (error) => {
      console.error('Save submission error:', error);
      setSaveStatus('error');
    },
  });

  // Initialize cameras
  const initializeCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      const cameraDevices: CameraDevice[] = videoDevices.map(device => {
        let facing: 'user' | 'environment' | 'unknown' = 'unknown';
        
        if (device.label.toLowerCase().includes('front') || device.label.toLowerCase().includes('user')) {
          facing = 'user';
        } else if (device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('rear') || device.label.toLowerCase().includes('environment')) {
          facing = 'environment';
        }
        
        const cameraDevice: CameraDevice = {
          deviceId: device.deviceId,
          label: device.label || `Camera ${videoDevices.indexOf(device) + 1}`,
          kind: device.kind,
          facing
        };
        return cameraDevice;
      });
      
      setCameras(cameraDevices);
      setHasPermission(true);
      
      if (cameraDevices.length > 0) {
        const rearCamera = cameraDevices.find(cam => cam.facing === 'environment');
        setSelectedCamera(rearCamera || cameraDevices[0]);
      }
    } catch (error) {
      console.error('Error initializing cameras:', error);
      setHasPermission(false);
    }
  };

  // Start camera
  const startCamera = async (camera: CameraDevice) => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          deviceId: camera.deviceId,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error starting camera:', error);
      setHasPermission(false);
    }
  };

  // Take a photo
  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    ctx.drawImage(video, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.9);
  }, []);

  // Start viewfinder mode
  const startViewfinder = () => {
    setShowViewfinder(true);
    setIsCapturing(true);
    setCapturedPhotos([]);
  };

  // Take all 12 photos in sequence for 4×3 rectangular grid
  const captureAllPhotos = () => {
    setCapturedPhotos([]);
    setIsCapturingSequence(true);
    let photoCount = 0;
    
    const captureSequence = () => {
      const photoData = takePhoto();
      if (photoData) {
        const newPhoto: CapturedPhoto = {
          id: photoCount,
          imageData: photoData,
          timestamp: Date.now()
        };
        
        setCapturedPhotos(prev => {
          const updated = [...prev, newPhoto];
          
          if (updated.length === 12) {
            setIsCapturingSequence(false);
            setTimeout(() => {
              setShowViewfinder(false);
              createRectangularCollage(updated);
            }, 500);
          }
          
          return updated;
        });
        
        photoCount++;
        
        if (photoCount < 12) {
          setTimeout(captureSequence, 250); // 4 fps for easier testing
        }
      }
    };
    
    captureSequence();
  };

  // Create 4×3 rectangular grid collage from 12 photos
  const createRectangularCollage = useCallback((photos: CapturedPhoto[]) => {
    if (photos.length !== 12 || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    
    // Create 4:3 aspect ratio canvas
    const collageWidth = 1200;
    const collageHeight = 900; // 4:3 ratio
    canvas.width = collageWidth;
    canvas.height = collageHeight;
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, collageWidth, collageHeight);
    
    // 4×3 grid layout
    const cols = 4;
    const rows = 3;
    const rectWidth = collageWidth / cols;  // 300px each
    const rectHeight = collageHeight / rows; // 300px each
    
    let loadedCount = 0;
    
    photos.forEach((photo, index) => {
      const img = new Image();
      img.onload = () => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        
        // Calculate destination rectangle position
        const destX = col * rectWidth;
        const destY = row * rectHeight;
        
        // Draw the photo to fill the entire rectangle
        ctx.drawImage(
          img,
          0, 0, img.width, img.height,
          destX, destY, rectWidth, rectHeight
        );
        
        loadedCount++;
        if (loadedCount === 12) {
          const collageData = canvas.toDataURL('image/jpeg', 0.9);
          setFinalCollage(collageData);
          
          // Save to gallery
          setSaveStatus('saving');
          saveSubmissionMutation.mutate({
            imageData: collageData,
            flowerCount: 12
          });
        }
      };
      img.src = photo.imageData;
    });
  }, [saveSubmissionMutation]);

  // Initialize cameras on mount
  useEffect(() => {
    initializeCameras();
  }, []);

  // Start camera when selected camera changes
  useEffect(() => {
    if (selectedCamera && hasPermission) {
      startCamera(selectedCamera);
    }
  }, [selectedCamera, hasPermission]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (captureTimeoutRef.current) {
        clearInterval(captureTimeoutRef.current);
      }
    };
  }, [stream]);

  if (hasPermission === null) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4">Requesting camera access...</div>
        </div>
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <h2 className="text-2xl font-bold mb-4">Camera Access Required</h2>
          <p className="mb-6">This app needs camera access to create rectangular collages. Please enable camera permissions and refresh the page.</p>
          <Link href="/projects/cameras">
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors">
              Back to Cameras
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-black text-white overflow-hidden relative"
      style={{
        fontFamily: 'Georgia, "Times New Roman", Times, serif',
        touchAction: 'manipulation',
        userSelect: 'none'
      }}
    >
      {/* Navigation */}
      {!isCapturing && !finalCollage && (
        <div className="absolute top-4 left-4 z-50">
          <Link href="/projects/cameras">
            <button className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors">
              ← Cameras
            </button>
          </Link>
        </div>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={showViewfinder ? "absolute inset-0 w-full h-full object-cover" : "hidden"}
      />

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera selection and controls */}
      {!isCapturing && !finalCollage && (
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
          <h1 className="text-4xl font-bold mb-8 text-center">12-Photo Rectangular Collage</h1>
          <p className="text-xl mb-8 text-center max-w-2xl">
            Click the shutter button to automatically capture 12 photos in sequence (4 per second). Each photo fills one rectangle in a perfect 4×3 grid layout for optimal space utilization.
          </p>
          
          {/* Camera selection */}
          {cameras.length > 1 && (
            <div className="mb-8">
              <h3 className="text-lg mb-4">Select Camera:</h3>
              <div className="space-y-2">
                {cameras.map(camera => (
                  <button
                    key={camera.deviceId}
                    onClick={() => setSelectedCamera(camera)}
                    className={`block w-full px-4 py-2 rounded-lg transition-colors ${
                      selectedCamera?.deviceId === camera.deviceId
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/20 hover:bg-white/30'
                    }`}
                  >
                    {camera.label} ({camera.facing})
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <button
            onClick={startViewfinder}
            disabled={!selectedCamera}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors"
          >
            Start Camera
          </button>
        </div>
      )}

      {/* Viewfinder mode */}
      {showViewfinder && (
        <div className="absolute inset-0 z-10">
          {/* Grid overlay showing 4×3 layout */}
          <div className="absolute inset-0 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 4 3" preserveAspectRatio="none">
              {/* Vertical grid lines */}
              {Array.from({ length: 3 }, (_, i) => (
                <line
                  key={`v${i}`}
                  x1={i + 1}
                  y1="0"
                  x2={i + 1}
                  y2="3"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="0.05"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {/* Horizontal grid lines */}
              {Array.from({ length: 2 }, (_, i) => (
                <line
                  key={`h${i}`}
                  x1="0"
                  y1={i + 1}
                  x2="4"
                  y2={i + 1}
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="0.05"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
          </div>

          {/* Bottom controls */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-auto">
            <div className="text-center">
              {isCapturingSequence && (
                <div className="text-white text-lg mb-4 font-semibold">
                  Taking photo {capturedPhotos.length + 1} of 12...
                </div>
              )}
              <button
                onClick={captureAllPhotos}
                disabled={isCapturingSequence}
                className={`w-20 h-20 border-4 border-gray-300 rounded-full transition-all duration-200 shadow-lg ${
                  isCapturingSequence 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-white hover:bg-gray-100'
                }`}
                style={{ boxShadow: '0 0 0 4px rgba(255,255,255,0.3)' }}
              >
                <div className={`w-full h-full rounded-full border-2 ${
                  isCapturingSequence 
                    ? 'bg-gray-400 border-gray-500' 
                    : 'bg-white border-gray-400'
                }`}></div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final collage display */}
      {finalCollage && (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
          <h1 className="text-4xl font-bold mb-8 text-center">Rectangular Collage Complete!</h1>
          
          <div className="mb-8 max-w-4xl">
            <img 
              src={finalCollage} 
              alt="Rectangular collage"
              className="w-full h-auto rounded-lg shadow-2xl"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex gap-4">
              <a
                href={finalCollage}
                download="rectangular-collage.jpg"
                className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold transition-colors"
              >
                Download Collage
              </a>
              
              <Link href="/projects/kaleidoscope-gallery">
                <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors">
                  View Gallery
                </button>
              </Link>
            </div>
            
            <div>
              <Link href="/projects/cameras">
                <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors">
                  Back to Cameras
                </button>
              </Link>
            </div>
          </div>
          
          {saveStatus === 'saving' && (
            <div className="mt-4 text-yellow-400">Saving to gallery...</div>
          )}
          {saveStatus === 'saved' && (
            <div className="mt-4 text-green-400">Saved to gallery!</div>
          )}
          {saveStatus === 'error' && (
            <div className="mt-4 text-red-400">Error saving to gallery</div>
          )}
        </div>
      )}
    </div>
  );
}