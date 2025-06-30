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
      
      // Create true tessellation with interlocking hexagons and squares
      const canvasSize = 800;
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvasSize, canvasSize);
      
      // Define tessellation pattern - hexagons with squares filling gaps
      const hexRadius = canvasSize / 12; // Size of hexagons
      const hexWidth = hexRadius * 2;
      const hexHeight = hexRadius * Math.sqrt(3);
      
      // Calculate how many shapes fit
      const hexCols = Math.floor(canvasSize / (hexWidth * 0.75));
      const hexRows = Math.floor(canvasSize / hexHeight);
      
      let shapeIndex = 0;
      let loadedCount = 0;
      
      // Create array to track all shapes and their positions
      const shapes = [];
      
      // Place hexagons in tessellation pattern
      for (let row = 0; row < hexRows && shapeIndex < TOTAL_PHOTOS; row++) {
        for (let col = 0; col < hexCols && shapeIndex < TOTAL_PHOTOS; col++) {
          const offsetX = (row % 2) * hexWidth * 0.375; // Offset every other row
          const centerX = col * hexWidth * 0.75 + hexRadius + offsetX;
          const centerY = row * hexHeight + hexRadius;
          
          if (centerX + hexRadius < canvasSize && centerY + hexRadius < canvasSize) {
            shapes.push({
              type: 'hex',
              centerX,
              centerY,
              radius: hexRadius,
              photoIndex: shapeIndex
            });
            shapeIndex++;
          }
        }
      }
      
      // Fill remaining spots with squares
      const squareSize = hexRadius * 0.8;
      const squareCols = Math.floor(canvasSize / squareSize);
      const squareRows = Math.floor(canvasSize / squareSize);
      
      for (let row = 0; row < squareRows && shapeIndex < TOTAL_PHOTOS; row++) {
        for (let col = 0; col < squareCols && shapeIndex < TOTAL_PHOTOS; col++) {
          const x = col * squareSize;
          const y = row * squareSize;
          const centerX = x + squareSize / 2;
          const centerY = y + squareSize / 2;
          
          // Check if this square position overlaps with any hexagon
          let overlaps = false;
          for (const shape of shapes) {
            if (shape.type === 'hex') {
              const dist = Math.sqrt((centerX - shape.centerX) ** 2 + (centerY - shape.centerY) ** 2);
              if (dist < shape.radius + squareSize / 2) {
                overlaps = true;
                break;
              }
            }
          }
          
          if (!overlaps) {
            shapes.push({
              type: 'square',
              x,
              y,
              size: squareSize,
              photoIndex: shapeIndex
            });
            shapeIndex++;
          }
        }
      }
      
      // Limit to available photos
      const finalShapes = shapes.slice(0, TOTAL_PHOTOS);
      
      // Draw each shape with its corresponding photo section
      finalShapes.forEach((shape, index) => {
        const photo = photos[index];
        if (!photo) return;
        
        const img = new Image();
        img.onload = () => {
          ctx.save();
          
          if (shape.type === 'hex') {
            // Create hexagonal clip path
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const angle = (i * Math.PI) / 3;
              const x = shape.centerX + shape.radius * Math.cos(angle);
              const y = shape.centerY + shape.radius * Math.sin(angle);
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.clip();
            
            // Draw photo to fill hexagon
            const imgSize = shape.radius * 2.2;
            ctx.drawImage(
              img,
              shape.centerX - imgSize/2,
              shape.centerY - imgSize/2,
              imgSize,
              imgSize
            );
          } else {
            // Create square clip path
            ctx.beginPath();
            ctx.rect(shape.x, shape.y, shape.size, shape.size);
            ctx.clip();
            
            // Draw photo to fill square
            ctx.drawImage(
              img,
              shape.x,
              shape.y,
              shape.size,
              shape.size
            );
          }
          
          ctx.restore();
          
          loadedCount++;
          if (loadedCount === finalShapes.length) {
            const collageData = canvas.toDataURL('image/jpeg', 0.9);
            setFinalCollage(collageData);
            
            // Save to gallery
            setSaveStatus('saving');
            saveSubmissionMutation.mutate({
              imageData: collageData,
              flowerCount: finalShapes.length
            });
          }
        };
        img.src = photo.imageData;
      });
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
            {/* Live Tessellation Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 800 800" preserveAspectRatio="none">
                {(() => {
                  const shapes = [];
                  const hexRadius = 800 / 12;
                  const hexWidth = hexRadius * 2;
                  const hexHeight = hexRadius * Math.sqrt(3);
                  const hexCols = Math.floor(800 / (hexWidth * 0.75));
                  const hexRows = Math.floor(800 / hexHeight);
                  
                  let shapeIndex = 0;
                  
                  // Place hexagons
                  for (let row = 0; row < hexRows && shapeIndex < TOTAL_PHOTOS; row++) {
                    for (let col = 0; col < hexCols && shapeIndex < TOTAL_PHOTOS; col++) {
                      const offsetX = (row % 2) * hexWidth * 0.375;
                      const centerX = col * hexWidth * 0.75 + hexRadius + offsetX;
                      const centerY = row * hexHeight + hexRadius;
                      
                      if (centerX + hexRadius < 800 && centerY + hexRadius < 800) {
                        shapes.push({
                          type: 'hex',
                          centerX,
                          centerY,
                          radius: hexRadius,
                          index: shapeIndex
                        });
                        shapeIndex++;
                      }
                    }
                  }
                  
                  // Fill with squares
                  const squareSize = hexRadius * 0.8;
                  const squareCols = Math.floor(800 / squareSize);
                  const squareRows = Math.floor(800 / squareSize);
                  
                  for (let row = 0; row < squareRows && shapeIndex < TOTAL_PHOTOS; row++) {
                    for (let col = 0; col < squareCols && shapeIndex < TOTAL_PHOTOS; col++) {
                      const x = col * squareSize;
                      const y = row * squareSize;
                      const centerX = x + squareSize / 2;
                      const centerY = y + squareSize / 2;
                      
                      let overlaps = false;
                      for (const shape of shapes) {
                        if (shape.type === 'hex') {
                          const dist = Math.sqrt((centerX - shape.centerX) ** 2 + (centerY - shape.centerY) ** 2);
                          if (dist < shape.radius + squareSize / 2) {
                            overlaps = true;
                            break;
                          }
                        }
                      }
                      
                      if (!overlaps) {
                        shapes.push({
                          type: 'square',
                          x,
                          y,
                          size: squareSize,
                          index: shapeIndex
                        });
                        shapeIndex++;
                      }
                    }
                  }
                  
                  return shapes.slice(0, TOTAL_PHOTOS).map((shape) => {
                    const captured = shape.index < capturedPhotos.length;
                    const current = shape.index === capturedPhotos.length && isCapturingSequence;
                    
                    if (shape.type === 'hex') {
                      const points = Array.from({ length: 6 }, (_, j) => {
                        const angle = (j * Math.PI) / 3;
                        const x = shape.centerX + shape.radius * Math.cos(angle);
                        const y = shape.centerY + shape.radius * Math.sin(angle);
                        return `${x},${y}`;
                      }).join(' ');

                      return (
                        <polygon
                          key={shape.index}
                          points={points}
                          fill={captured ? "rgba(34, 197, 94, 0.3)" : current ? "rgba(251, 191, 36, 0.5)" : "transparent"}
                          stroke={captured ? "rgba(34, 197, 94, 0.8)" : current ? "rgba(251, 191, 36, 1)" : "rgba(255, 255, 255, 0.3)"}
                          strokeWidth="2"
                        />
                      );
                    } else {
                      return (
                        <rect
                          key={shape.index}
                          x={shape.x}
                          y={shape.y}
                          width={shape.size}
                          height={shape.size}
                          fill={captured ? "rgba(34, 197, 94, 0.3)" : current ? "rgba(251, 191, 36, 0.5)" : "transparent"}
                          stroke={captured ? "rgba(34, 197, 94, 0.8)" : current ? "rgba(251, 191, 36, 1)" : "rgba(255, 255, 255, 0.3)"}
                          strokeWidth="2"
                        />
                      );
                    }
                  });
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