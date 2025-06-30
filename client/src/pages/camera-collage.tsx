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

export default function CameraCollage() {
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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get available cameras
  const getCameras = async () => {
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
      if (cameraDevices.length > 0 && !selectedCamera) {
        // Prefer rear camera if available
        const rearCamera = cameraDevices.find(cam => cam.facing === 'environment');
        setSelectedCamera(rearCamera || cameraDevices[0]);
      }
    } catch (error) {
      console.error('Error getting cameras:', error);
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
      setHasPermission(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error starting camera:', error);
      setHasPermission(false);
    }
  };

  // Request permission and get cameras
  useEffect(() => {
    const requestPermission = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        mediaStream.getTracks().forEach(track => track.stop());
        setHasPermission(true);
        await getCameras();
      } catch (error) {
        setHasPermission(false);
      }
    };
    
    requestPermission();
  }, []);

  // Start selected camera
  useEffect(() => {
    if (selectedCamera && hasPermission) {
      startCamera(selectedCamera);
    }
  }, [selectedCamera, hasPermission]);

  // Take a photo
  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame
    ctx.drawImage(video, 0, 0);
    
    // Get image data
    return canvas.toDataURL('image/jpeg', 0.9);
  }, []);

  // Create collage from specific sections of 20 photos (5 rows x 4 columns)
  const createCollage = useCallback((photos: CapturedPhoto[]) => {
    if (photos.length !== 20 || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    
    // Set collage size (4:5 aspect ratio for 4 columns x 5 rows)
    const collageWidth = 800;
    const collageHeight = 1000;
    canvas.width = collageWidth;
    canvas.height = collageHeight;
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, collageWidth, collageHeight);
    
    // Calculate grid dimensions
    const cols = 4;
    const rows = 5;
    const cellWidth = collageWidth / cols;
    const cellHeight = collageHeight / rows;
    
    let loadedCount = 0;
    
    photos.forEach((photo, index) => {
      const img = new Image();
      img.onload = () => {
        // Calculate which grid position this photo should fill
        const col = index % cols;
        const row = Math.floor(index / cols);
        
        // Calculate source section from the photo (the specific part we want)
        const sourceWidth = img.width / cols;
        const sourceHeight = img.height / rows;
        const sourceX = col * sourceWidth;
        const sourceY = row * sourceHeight;
        
        // Calculate destination position in final collage
        const destX = col * cellWidth;
        const destY = row * cellHeight;
        
        // Draw only the specific section of this photo to its grid position
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,  // Source: specific section of photo
          destX, destY, cellWidth, cellHeight            // Destination: corresponding grid cell
        );
        
        loadedCount++;
        if (loadedCount === 20) {
          // All photos processed, create final collage
          const collageData = canvas.toDataURL('image/jpeg', 0.9);
          setFinalCollage(collageData);
          
          // Save to gallery
          setSaveStatus('saving');
          saveSubmissionMutation.mutate({
            imageData: collageData,
            flowerCount: 20 // Use 20 for photo count
          });
          
          // Stop camera
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
        }
      };
      img.src = photo.imageData;
    });
  }, [stream, saveSubmissionMutation]);

  // Start viewfinder mode
  const startViewfinder = () => {
    setShowViewfinder(true);
    setIsCapturing(true);
    setCapturedPhotos([]);
  };

  // Take all 20 photos in sequence
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
          
          // If we have all 20 photos, create collage
          if (updated.length === 20) {
            setIsCapturingSequence(false);
            setTimeout(() => {
              setShowViewfinder(false);
              createCollage(updated);
            }, 500); // Brief delay to show final photo
          }
          
          return updated;
        });
        
        photoCount++;
        
        // Continue capturing if we need more photos
        if (photoCount < 20) {
          setTimeout(captureSequence, 250); // 0.25 seconds between photos
        }
      }
    };
    
    // Start the sequence
    captureSequence();
  };

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
          <p className="mb-6">This app needs camera access to create photo collages. Please enable camera permissions and refresh the page.</p>
          <Link href="/projects">
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors">
              Back to Projects
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
          <Link href="/projects">
            <button className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors">
              ← Projects
            </button>
          </Link>
        </div>
      )}

      {/* Video element - show when in viewfinder mode */}
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
          <h1 className="text-4xl font-bold mb-8 text-center">20-Photo Collage</h1>
          <p className="text-xl mb-8 text-center max-w-2xl">
            Click the shutter button to automatically capture 20 photos in sequence (4 per second). Each photo contributes one specific section to create a seamless collage composition.
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
          
          {/* Sectional Pattern Preview */}
          {selectedCamera && (
            <div className="mb-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4 text-center">
                Sectional Grid Pattern Preview
              </h3>
              
              <div className="bg-gray-900 rounded-lg p-4 max-w-xs mx-auto" style={{ aspectRatio: '5/4' }}>
                <svg className="w-full h-full" viewBox="0 0 5 4">
                  {Array.from({ length: 20 }, (_, i) => {
                    const col = i % 5;
                    const row = Math.floor(i / 5);

                    return (
                      <rect
                        key={i}
                        x={col}
                        y={row}
                        width={0.95}
                        height={0.95}
                        fill="rgba(236, 72, 153, 0.3)"
                        stroke="rgba(236, 72, 153, 0.8)"
                        strokeWidth="0.02"
                      />
                    );
                  })}
                </svg>
              </div>
              
              <div className="text-center mt-4 text-sm text-gray-300">
                20 sections in optimized 5×4 grid layout
              </div>
            </div>
          )}
          
          {/* Start capture button */}
          <button
            onClick={startViewfinder}
            className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-lg text-white text-xl font-semibold transition-colors"
          >
            Start 4-Photo Collage
          </button>
        </div>
      )}

      {/* Viewfinder with controls */}
      {showViewfinder && !finalCollage && (
        <div className="fixed inset-0 z-50">
          {/* Camera controls overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Top bar with progress */}
            <div className="absolute top-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-4 pointer-events-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="text-white text-lg font-semibold">
                  Photo {capturedPhotos.length + 1} of 20
                </div>
                <button
                  onClick={() => {
                    setShowViewfinder(false);
                    setIsCapturing(false);
                    setCapturedPhotos([]);
                    setIsCapturingSequence(false);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(capturedPhotos.length / 20) * 100}%` }}
                />
              </div>
            </div>

            {/* Captured photos preview - 5 rows x 4 columns */}
            <div className="absolute top-24 left-4 pointer-events-auto">
              <div className="grid grid-cols-4 gap-1 w-64">
                {capturedPhotos.map((photo, index) => (
                  <div key={photo.id} className="w-15 h-12 border border-green-500 rounded overflow-hidden">
                    <img src={photo.imageData} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
                {Array.from({ length: 20 - capturedPhotos.length }).map((_, index) => (
                  <div key={`empty-${index}`} className="w-15 h-12 border border-gray-500 border-dashed rounded bg-black/30" />
                ))}
              </div>
            </div>

            {/* Live Sectional Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 5 4" preserveAspectRatio="none">
                {Array.from({ length: 20 }, (_, i) => {
                  const col = i % 5;
                  const row = Math.floor(i / 5);
                  
                  const captured = i < capturedPhotos.length;
                  const current = i === capturedPhotos.length && isCapturingSequence;

                  return (
                    <rect
                      key={i}
                      x={col}
                      y={row}
                      width={0.95}
                      height={0.95}
                      fill={captured ? 'rgba(236, 72, 153, 0.3)' : current ? 'rgba(255, 255, 0, 0.5)' : 'none'}
                      stroke={captured ? 'rgba(236, 72, 153, 0.8)' : current ? 'rgba(255, 255, 0, 1)' : 'rgba(255, 255, 255, 0.4)'}
                      strokeWidth="0.04"
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}
              </svg>
            </div>

            {/* Center viewfinder frame */}
            <div className="absolute inset-4 border-2 border-white/50 rounded-lg pointer-events-none">
              <div className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
              <div className="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
              <div className="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
              <div className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>
            </div>

            {/* Bottom controls */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-auto">
              <div className="text-center">
                {isCapturingSequence && (
                  <div className="text-white text-lg mb-4 font-semibold">
                    Taking photo {capturedPhotos.length + 1} of 20...
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

            {/* Flash effect overlay when taking photo */}
            {isCapturingSequence && (
              <div 
                className="absolute inset-0 bg-white pointer-events-none"
                style={{
                  opacity: capturedPhotos.length > 0 ? 0 : 0.7,
                  transition: 'opacity 0.1s ease-out'
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Final collage display */}
      {finalCollage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/90">
          <div className="text-center p-8 bg-white/10 backdrop-blur-lg rounded-2xl max-w-2xl mx-4">
            <h2 className="text-2xl font-bold mb-4">Collage Complete!</h2>
            <p className="mb-4">Your 4-photo collage has been created.</p>
            
            {/* Save status */}
            <div className="mb-6">
              {saveStatus === 'saving' && (
                <div className="text-yellow-400 text-sm mb-2">
                  💾 Saving to gallery...
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="text-green-400 text-sm mb-2">
                  ✅ Saved to gallery!
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="text-red-400 text-sm mb-2">
                  ❌ Failed to save to gallery
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <img 
                src={finalCollage} 
                alt="4-photo collage" 
                className="max-w-full max-h-96 rounded-lg mx-auto"
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4 justify-center">
                <a
                  href={finalCollage}
                  download="photo-collage.jpg"
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
                <Link href="/projects">
                  <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors">
                    Back to Projects
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}