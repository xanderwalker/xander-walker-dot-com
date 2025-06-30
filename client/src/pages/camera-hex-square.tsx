import { useState, useRef, useEffect, useCallback } from 'react';
import Layout from '../components/layout';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

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

export default function CameraHexSquare() {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<CameraDevice | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showViewfinder, setShowViewfinder] = useState(false);
  const [isCapturingSequence, setIsCapturingSequence] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [finalCollage, setFinalCollage] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const queryClient = useQueryClient();

  const TOTAL_PHOTOS = 64; // 8x8 grid
  const CAPTURE_FPS = 8;

  // Save submission mutation
  const saveSubmissionMutation = useMutation({
    mutationFn: async (data: { imageData: string; flowerCount: number }) => 
      await apiRequest('/api/kaleidoscope-submissions', 'POST', data),
    onSuccess: () => {
      setSaveStatus('saved');
      queryClient.invalidateQueries({ queryKey: ['/api/kaleidoscope-submissions'] });
    },
    onError: () => {
      setSaveStatus('error');
    }
  });

  // Initialize cameras
  const initializeCameras = async () => {
    try {
      // Request camera permission
      await navigator.mediaDevices.getUserMedia({ video: true });
      setHasPermission(true);
      
      // Get available cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      const cameraDevices: CameraDevice[] = videoDevices.map(device => {
        const cameraDevice: CameraDevice = {
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
          kind: device.kind,
          facing: device.label.toLowerCase().includes('front') || device.label.toLowerCase().includes('user') ? 'user' :
                 device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('environment') ? 'environment' : 'unknown'
        };
        return cameraDevice;
      });
      
      setCameras(cameraDevices);
      if (cameraDevices.length > 0) {
        setSelectedCamera(cameraDevices[0]);
      }
    } catch (error) {
      console.error('Error accessing cameras:', error);
      setHasPermission(false);
    }
  };

  // Start camera stream
  const startCamera = async (camera: CameraDevice) => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: camera.deviceId }
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (error) {
      console.error('Error starting camera:', error);
    }
  };

  // Start viewfinder
  const startViewfinder = () => {
    setShowViewfinder(true);
  };

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);

    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  // Start capture sequence
  const startCaptureSequence = useCallback(() => {
    if (isCapturingSequence) return;
    
    setIsCapturingSequence(true);
    setCapturedPhotos([]);
    
    let photoCount = 0;
    const interval = 1000 / CAPTURE_FPS; // milliseconds between captures
    
    captureTimeoutRef.current = setInterval(() => {
      const photoData = capturePhoto();
      if (photoData) {
        const newPhoto: CapturedPhoto = {
          id: photoCount,
          imageData: photoData,
          timestamp: Date.now()
        };
        
        setCapturedPhotos(prev => [...prev, newPhoto]);
        photoCount++;
        
        if (photoCount >= TOTAL_PHOTOS) {
          if (captureTimeoutRef.current) {
            clearInterval(captureTimeoutRef.current);
          }
          setIsCapturingSequence(false);
        }
      }
    }, interval);
  }, [capturePhoto, isCapturingSequence, CAPTURE_FPS, TOTAL_PHOTOS]);

  // Process photos into final collage
  const processCollage = useCallback((photos: CapturedPhoto[]) => {
    if (photos.length < TOTAL_PHOTOS) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load first image to get dimensions
    const firstImg = new Image();
    firstImg.onload = () => {
      const originalAspectRatio = firstImg.width / firstImg.height;
      
      // Create proper octagon-square tessellation like the reference image
      const canvasSize = 800;
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvasSize, canvasSize);
      
      // Define tessellation pattern - octagons with small squares in gaps
      const octCols = 8; // 8x8 grid of octagons
      const octRows = 8;
      const cellSize = canvasSize / octCols;
      const octRadius = cellSize * 0.3; // Octagon radius
      const smallSquareSize = cellSize * 0.15; // Small gap squares
      
      let loadedCount = 0;
      const totalShapes = octCols * octRows + (octCols - 1) * (octRows - 1); // Octagons + gap squares
      
      // Draw octagons first
      for (let row = 0; row < octRows; row++) {
        for (let col = 0; col < octCols; col++) {
          const photoIndex = row * octCols + col;
          if (photoIndex >= TOTAL_PHOTOS) continue;
          
          const photo = photos[photoIndex];
          if (!photo) continue;
          
          const img = new Image();
          img.onload = () => {
            const centerX = col * cellSize + cellSize / 2;
            const centerY = row * cellSize + cellSize / 2;
            
            ctx.save();
            
            // Create octagon clip path
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
              const angle = (i * Math.PI) / 4;
              const x = centerX + octRadius * Math.cos(angle);
              const y = centerY + octRadius * Math.sin(angle);
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.clip();
            
            // Extract corresponding section from photo
            const sourceWidth = img.width / octCols;
            const sourceHeight = img.height / octRows;
            const sourceX = col * sourceWidth;
            const sourceY = row * sourceHeight;
            
            // Draw the specific section of the photo
            ctx.drawImage(
              img,
              sourceX, sourceY, sourceWidth, sourceHeight,
              centerX - octRadius, centerY - octRadius, octRadius * 2, octRadius * 2
            );
            
            ctx.restore();
            
            loadedCount++;
            if (loadedCount === TOTAL_PHOTOS) {
              // Add small squares in gaps
              addGapSquares();
            }
          };
          img.src = photo.imageData;
        }
      }
      
      function addGapSquares() {
        // Add small squares between octagons
        for (let row = 0; row < octRows - 1; row++) {
          for (let col = 0; col < octCols - 1; col++) {
            const centerX = (col + 1) * cellSize;
            const centerY = (row + 1) * cellSize;
            
            ctx.fillStyle = '#333';
            ctx.fillRect(
              centerX - smallSquareSize / 2,
              centerY - smallSquareSize / 2,
              smallSquareSize,
              smallSquareSize
            );
          }
        }
        
        const collageData = canvas.toDataURL('image/jpeg', 0.9);
        setFinalCollage(collageData);
        
        // Save to gallery
        setSaveStatus('saving');
        saveSubmissionMutation.mutate({
          imageData: collageData,
          flowerCount: TOTAL_PHOTOS
        });
      }
    };
    
    firstImg.src = photos[0].imageData;
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

  // Process collage when we have enough photos
  useEffect(() => {
    if (capturedPhotos.length === TOTAL_PHOTOS) {
      processCollage(capturedPhotos);
    }
  }, [capturedPhotos, processCollage]);

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
      <Layout title="HYBRID TESSELLATION CAMERA">
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <p className="text-xl">Requesting camera permission...</p>
        </div>
      </Layout>
    );
  }

  if (hasPermission === false) {
    return (
      <Layout title="HYBRID TESSELLATION CAMERA">
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl mb-4">Camera access denied</p>
            <p className="text-gray-400">Please allow camera access to use this feature</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (finalCollage) {
    return (
      <Layout title="HYBRID TESSELLATION CAMERA">
        <div className="min-h-screen bg-black text-white p-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-8">Hex-Square Composite Complete!</h1>
            
            <div className="mb-8">
              <img 
                src={finalCollage} 
                alt="Hybrid Tessellation Composite" 
                className="w-full max-w-2xl mx-auto rounded-lg shadow-2xl"
              />
            </div>

            <div className="flex gap-4 justify-center mb-8">
              <button 
                onClick={() => {
                  const link = document.createElement('a');
                  link.download = `hybrid-tessellation-${Date.now()}.jpg`;
                  link.href = finalCollage;
                  link.click();
                }}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold rounded-lg"
              >
                Download Composite
              </button>
              <button 
                onClick={() => {
                  setCapturedPhotos([]);
                  setFinalCollage(null);
                  setShowViewfinder(false);
                  setSaveStatus('idle');
                }}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-lg"
              >
                Capture New Composite
              </button>
            </div>

            <p className="text-gray-300 text-lg">
              64 photos captured in alternating hexagonal and square patterns
            </p>
            
            {saveStatus === 'saved' && (
              <p className="text-green-400 mt-4">✓ Saved to gallery</p>
            )}
            {saveStatus === 'saving' && (
              <p className="text-yellow-400 mt-4">Saving to gallery...</p>
            )}
            {saveStatus === 'error' && (
              <p className="text-red-400 mt-4">Failed to save to gallery</p>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="HYBRID TESSELLATION CAMERA">
      <div className="min-h-screen bg-black text-white relative">
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
        {!isCapturingSequence && !finalCollage && (
          <div className="flex flex-col items-center justify-center min-h-screen p-8">
            <h1 className="text-4xl font-bold mb-8 text-center">Hybrid Tessellation Camera</h1>
            <p className="text-xl mb-8 text-center max-w-2xl">
              Advanced geometric patterns combining hexagonal and square shapes in an alternating 8×8 grid. Creates stunning dual-pattern composites with perfect tessellation symmetry.
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
            {/* Live Octagon-Square Tessellation Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 800 800" preserveAspectRatio="none">
                {(() => {
                  const octCols = 8;
                  const octRows = 8;
                  const cellSize = 800 / octCols;
                  const octRadius = cellSize * 0.3;
                  const shapes = [];
                  
                  // Create octagons
                  for (let row = 0; row < octRows; row++) {
                    for (let col = 0; col < octCols; col++) {
                      const index = row * octCols + col;
                      const centerX = col * cellSize + cellSize / 2;
                      const centerY = row * cellSize + cellSize / 2;
                      
                      const captured = index < capturedPhotos.length;
                      const current = index === capturedPhotos.length && isCapturingSequence;
                      
                      // Create octagon points
                      const points = Array.from({ length: 8 }, (_, i) => {
                        const angle = (i * Math.PI) / 4;
                        const x = centerX + octRadius * Math.cos(angle);
                        const y = centerY + octRadius * Math.sin(angle);
                        return `${x},${y}`;
                      }).join(' ');

                      shapes.push(
                        <polygon
                          key={index}
                          points={points}
                          fill={captured ? "rgba(34, 197, 94, 0.3)" : current ? "rgba(251, 191, 36, 0.5)" : "transparent"}
                          stroke={captured ? "rgba(34, 197, 94, 0.8)" : current ? "rgba(251, 191, 36, 1)" : "rgba(255, 255, 255, 0.3)"}
                          strokeWidth="2"
                        />
                      );
                    }
                  }
                  
                  // Add small squares in gaps
                  const smallSquareSize = cellSize * 0.15;
                  for (let row = 0; row < octRows - 1; row++) {
                    for (let col = 0; col < octCols - 1; col++) {
                      const centerX = (col + 1) * cellSize;
                      const centerY = (row + 1) * cellSize;
                      
                      shapes.push(
                        <rect
                          key={`gap-${row}-${col}`}
                          x={centerX - smallSquareSize / 2}
                          y={centerY - smallSquareSize / 2}
                          width={smallSquareSize}
                          height={smallSquareSize}
                          fill="rgba(255, 255, 255, 0.1)"
                          stroke="rgba(255, 255, 255, 0.3)"
                          strokeWidth="1"
                        />
                      );
                    }
                  }
                  
                  return shapes;
                })()}
              </svg>
            </div>

            {/* Capture controls */}
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex justify-center">
                {!isCapturingSequence ? (
                  <button
                    onClick={startCaptureSequence}
                    className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 hover:border-blue-400 transition-colors flex items-center justify-center"
                  >
                    <div className="w-12 h-12 bg-red-500 rounded-full"></div>
                  </button>
                ) : (
                  <div className="text-center">
                    <div className="w-20 h-20 bg-red-500 rounded-full animate-pulse mb-2"></div>
                    <p className="text-white text-sm">
                      Capturing {capturedPhotos.length}/{TOTAL_PHOTOS}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}