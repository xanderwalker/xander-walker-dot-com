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

export default function CameraHexagon() {
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
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    ctx.drawImage(video, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.9);
  }, []);

  // Create interlocking hexagonal collage from 100 photos (10x10 grid)
  const createHexagonalCollage = useCallback((photos: CapturedPhoto[]) => {
    if (photos.length !== 100 || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    
    const collageWidth = 1000;
    const collageHeight = 1000;
    canvas.width = collageWidth;
    canvas.height = collageHeight;
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, collageWidth, collageHeight);
    
    // Calculate interlocking hexagon dimensions
    const cols = 10;
    const rows = 10;
    const hexRadius = 50; // Radius of each hexagon
    const hexWidth = hexRadius * 2;
    const hexHeight = Math.sqrt(3) * hexRadius; // Height of hexagon
    
    // Horizontal and vertical spacing for tight interlocking pattern
    const horizontalSpacing = hexWidth * 0.75; // 3/4 width for interlocking
    const verticalSpacing = hexHeight * 0.75; // Reduced vertical spacing for touching edges
    
    let loadedCount = 0;
    
    photos.forEach((photo, index) => {
      const img = new Image();
      img.onload = () => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        
        // Calculate source section from the photo
        const sourceWidth = img.width / cols;
        const sourceHeight = img.height / rows;
        const sourceX = col * sourceWidth;
        const sourceY = row * sourceHeight;
        
        // Calculate hexagon center position for interlocking pattern
        // Offset every other row for honeycomb pattern
        const offsetX = (row % 2) * (horizontalSpacing / 2);
        const centerX = offsetX + col * horizontalSpacing + hexRadius;
        const centerY = row * verticalSpacing + hexRadius;
        
        // Create hexagonal clipping path
        ctx.save();
        ctx.beginPath();
        
        // Draw hexagon path (flat-top orientation)
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3 - Math.PI / 6; // Rotate 30 degrees for flat-top
          const x = centerX + hexRadius * Math.cos(angle);
          const y = centerY + hexRadius * Math.sin(angle);
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.clip();
        
        // Draw the photo section within the hexagon
        // Scale and position the image to fit the hexagon area
        const imageSize = hexRadius * 2.2; // Slightly larger to ensure full coverage
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,
          centerX - imageSize/2, centerY - imageSize/2, imageSize, imageSize
        );
        
        ctx.restore();
        
        loadedCount++;
        if (loadedCount === 100) {
          const collageData = canvas.toDataURL('image/jpeg', 0.9);
          setFinalCollage(collageData);
          
          setSaveStatus('saving');
          saveSubmissionMutation.mutate({
            imageData: collageData,
            flowerCount: 100
          });
          
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

  // Take all 100 photos in sequence
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
          
          if (updated.length === 100) {
            setIsCapturingSequence(false);
            setTimeout(() => {
              setShowViewfinder(false);
              createHexagonalCollage(updated);
            }, 500);
          }
          
          return updated;
        });
        
        photoCount++;
        
        if (photoCount < 100) {
          setTimeout(captureSequence, 10); // 0.01 seconds between photos (100 fps)
        }
      }
    };
    
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
          <p className="mb-6">This app needs camera access to create hexagonal collages. Please enable camera permissions and refresh the page.</p>
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
          <h1 className="text-4xl font-bold mb-8 text-center">100-Shot Hexagonal Collage</h1>
          <p className="text-xl mb-8 text-center max-w-2xl">
            Click the shutter button to automatically capture 100 photos in sequence (100 per second). Each photo contributes one interlocking hexagonal section to create a seamless honeycomb composite artwork.
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
          
          {/* Hexagon Pattern Preview */}
          <div className="mb-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4 text-center">
              Hexagon Pattern Preview
            </h3>
            
            <div className="aspect-square bg-gray-900 rounded-lg p-4 max-w-xs mx-auto">
              <svg className="w-full h-full" viewBox="0 0 10 10">
                {Array.from({ length: 100 }, (_, i) => {
                  const col = i % 10;
                  const row = Math.floor(i / 10);
                  
                  // Hexagon positioning
                  const centerX = col + 0.5 + (row % 2) * 0.5; // Offset every other row for honeycomb
                  const centerY = row * 0.85 + 0.5; // Tighter vertical spacing
                  const radius = 0.4;
                  
                  const points = Array.from({ length: 6 }, (_, j) => {
                    const angle = (j * Math.PI) / 3;
                    const x = centerX + radius * Math.cos(angle);
                    const y = centerY + radius * Math.sin(angle);
                    return `${x},${y}`;
                  }).join(' ');

                  return (
                    <polygon
                      key={i}
                      points={points}
                      fill="rgba(34, 197, 94, 0.3)"
                      stroke="rgba(34, 197, 94, 0.8)"
                      strokeWidth="0.02"
                    />
                  );
                })}
              </svg>
            </div>
            
            <div className="text-center mt-4 text-sm text-gray-300">
              100 interlocking hexagons in honeycomb pattern
            </div>
          </div>

          <button
            onClick={startViewfinder}
            className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-lg text-white text-xl font-semibold transition-colors"
          >
            Start 100-Shot Hexagonal Collage
          </button>
        </div>
      )}

      {/* Viewfinder with controls */}
      {showViewfinder && !finalCollage && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 pointer-events-none">
            {/* Top bar with progress */}
            <div className="absolute top-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-4 pointer-events-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="text-white text-lg font-semibold">
                  Photo {capturedPhotos.length + 1} of 100
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
              
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(capturedPhotos.length / 100) * 100}%` }}
                />
              </div>
            </div>

            {/* Captured photos preview - 10x10 grid */}
            <div className="absolute top-24 left-4 pointer-events-auto">
              <div className="grid grid-cols-10 gap-1 w-80">
                {capturedPhotos.map((photo, index) => (
                  <div key={photo.id} className="w-7 h-7 border border-green-500 rounded overflow-hidden">
                    <img src={photo.imageData} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
                {Array.from({ length: 100 - capturedPhotos.length }).map((_, index) => (
                  <div key={`empty-${index}`} className="w-7 h-7 border border-gray-500 border-dashed rounded bg-black/30" />
                ))}
              </div>
            </div>

            {/* Live Hexagon Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 10 10">
                {Array.from({ length: 100 }, (_, i) => {
                  const col = i % 10;
                  const row = Math.floor(i / 10);
                  
                  // Hexagon positioning for honeycomb pattern
                  const centerX = col + 0.5 + (row % 2) * 0.5;
                  const centerY = row * 0.85 + 0.5;
                  const radius = 0.4;
                  
                  const points = Array.from({ length: 6 }, (_, j) => {
                    const angle = (j * Math.PI) / 3;
                    const x = centerX + radius * Math.cos(angle);
                    const y = centerY + radius * Math.sin(angle);
                    return `${x},${y}`;
                  }).join(' ');

                  const captured = i < capturedPhotos.length;
                  const current = i === capturedPhotos.length && isCapturingSequence;

                  return (
                    <polygon
                      key={i}
                      points={points}
                      fill={captured ? 'rgba(34, 197, 94, 0.3)' : current ? 'rgba(255, 255, 0, 0.5)' : 'none'}
                      stroke={captured ? 'rgba(34, 197, 94, 0.8)' : current ? 'rgba(255, 255, 0, 1)' : 'rgba(255, 255, 255, 0.3)'}
                      strokeWidth="0.02"
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
                    Taking photo {capturedPhotos.length + 1} of 100...
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

            {/* Flash effect overlay */}
            {isCapturingSequence && (
              <div 
                className="absolute inset-0 bg-white pointer-events-none"
                style={{
                  opacity: capturedPhotos.length > 0 ? 0 : 0.7,
                  transition: 'opacity 0.05s ease-out'
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
            <h2 className="text-2xl font-bold mb-4">Hexagonal Collage Complete!</h2>
            <p className="mb-4">Your 100-shot hexagonal composite has been created.</p>
            
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
                alt="100-shot hexagonal collage" 
                className="max-w-full max-h-96 rounded-lg mx-auto"
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4 justify-center">
                <a
                  href={finalCollage}
                  download="hexagonal-collage.jpg"
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
          </div>
        </div>
      )}
    </div>
  );
}