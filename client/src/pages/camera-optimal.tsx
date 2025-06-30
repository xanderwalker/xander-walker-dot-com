import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, Download, Grid3X3, Square } from 'lucide-react';
import type { KaleidoscopeSubmission } from '@shared/schema';

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
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [finalCollage, setFinalCollage] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showViewfinder, setShowViewfinder] = useState(false);
  const [isCapturingSequence, setIsCapturingSequence] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  // Optimal grid dimensions for 4:3 aspect ratio (simplified for testing)
  const GRID_COLS = 4;
  const GRID_ROWS = 3;
  const TOTAL_PHOTOS = GRID_COLS * GRID_ROWS; // 12 photos

  // Initialize cameras
  const initializeCameras = async () => {
    try {
      // Request camera permission first
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      tempStream.getTracks().forEach(track => track.stop()); // Stop temp stream
      
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
      console.error('Error getting cameras:', error);
      setHasPermission(false);
    }
  };

  useEffect(() => {
    initializeCameras();
  }, []);

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

  // Connect stream to video element when stream changes
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !stream) return '';
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    return canvas.toDataURL('image/jpeg', 0.9);
  }, [stream]);

  // Create optimal rectangular grid collage from 144 photos (16x9 grid)
  const createOptimalCollage = useCallback((photos: CapturedPhoto[]) => {
    if (photos.length !== TOTAL_PHOTOS || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    
    // Use 4:3 aspect ratio for optimal output
    const collageWidth = 1200;
    const collageHeight = 900;
    canvas.width = collageWidth;
    canvas.height = collageHeight;
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, collageWidth, collageHeight);
    
    // Calculate perfect rectangle dimensions
    const rectWidth = collageWidth / GRID_COLS;
    const rectHeight = collageHeight / GRID_ROWS;
    
    let loadedCount = 0;
    
    photos.forEach((photo, index) => {
      const img = new Image();
      img.onload = () => {
        const col = index % GRID_COLS;
        const row = Math.floor(index / GRID_COLS);
        
        // Calculate source section from the photo (matching grid position)
        const sourceWidth = img.width / GRID_COLS;
        const sourceHeight = img.height / GRID_ROWS;
        const sourceX = col * sourceWidth;
        const sourceY = row * sourceHeight;
        
        // Calculate destination position (perfect grid with no gaps)
        const destX = col * rectWidth;
        const destY = row * rectHeight;
        
        // Draw the photo section as a perfect rectangle
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,
          destX, destY, rectWidth, rectHeight
        );
        
        loadedCount++;
        if (loadedCount === TOTAL_PHOTOS) {
          const collageData = canvas.toDataURL('image/jpeg', 0.9);
          
          console.log('Collage completed, saving and returning to viewfinder...');
          
          setSaveStatus('saving');
          
          saveSubmissionMutation.mutate({
            imageData: collageData,
            flowerCount: TOTAL_PHOTOS
          });
          
          // Clear captured photos and reset after short delay
          setTimeout(() => {
            setCapturedPhotos([]);
            setSaveStatus('saved');
            console.log('Returned to viewfinder');
            
            // Clear saved status after another delay
            setTimeout(() => {
              setSaveStatus('idle');
            }, 2000);
          }, 1000);
        }
      };
      img.src = photo.imageData;
    });
  }, [stream, TOTAL_PHOTOS, GRID_COLS, GRID_ROWS]);

  const { data: submissions = [] } = useQuery<KaleidoscopeSubmission[]>({
    queryKey: ['/api/kaleidoscope-submissions'],
  });

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
    onError: () => {
      setSaveStatus('error');
    },
  });

  // Start viewfinder mode
  const startViewfinder = () => {
    setShowViewfinder(true);
    setIsCapturing(true);
    setCapturedPhotos([]);
  };

  // Take all 12 photos in sequence
  const captureAllPhotos = () => {
    setCapturedPhotos([]);
    setIsCapturingSequence(true);
    let photoCount = 0;
    
    const captureSequence = () => {
      const photoData = capturePhoto();
      if (photoData) {
        const newPhoto: CapturedPhoto = {
          id: photoCount,
          imageData: photoData,
          timestamp: Date.now()
        };
        
        setCapturedPhotos(prev => {
          const updated = [...prev, newPhoto];
          
          console.log(`Captured photo ${updated.length}/${TOTAL_PHOTOS}`);
          
          if (updated.length === TOTAL_PHOTOS) {
            setIsCapturingSequence(false);
            setTimeout(() => {
              setShowViewfinder(false);
              createOptimalCollage(updated);
            }, 500);
          }
          
          return updated;
        });
        
        photoCount++;
        
        if (photoCount < TOTAL_PHOTOS) {
          setTimeout(captureSequence, 250); // 4 fps for easier testing
        }
      }
    };
    
    captureSequence();
  };

  const downloadImage = () => {
    if (!finalCollage) return;
    
    const link = document.createElement('a');
    link.download = `optimal-collage-${Date.now()}.jpg`;
    link.href = finalCollage;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetCamera = () => {
    setCapturedPhotos([]);
    setFinalCollage(null);
    setSaveStatus('idle');
    if (selectedCamera) {
      startCamera(selectedCamera);
    }
  };

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
          <p className="mb-6">This app needs camera access to create optimal collages. Please enable camera permissions and refresh the page.</p>
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
          <h1 className="text-4xl font-bold mb-8 text-center">12-Photo Optimal Collage</h1>
          <p className="text-xl mb-8 text-center max-w-2xl">
            Click the shutter button to automatically capture 12 photos in sequence (4 per second). Each photo contributes one rectangle to create a seamless 4×3 grid composite with maximum camera sensor utilization.
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
          {/* Grid overlay for preview */}
          <div className="absolute inset-0 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 4 3" preserveAspectRatio="none">
              {/* 4x3 grid lines */}
              {Array.from({ length: GRID_COLS - 1 }, (_, i) => (
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
              {Array.from({ length: GRID_ROWS - 1 }, (_, i) => (
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
                  Taking photo {capturedPhotos.length + 1} of {TOTAL_PHOTOS}...
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
          <h1 className="text-4xl font-bold mb-8 text-center">Optimal Collage Complete!</h1>
          
          <div className="mb-8 max-w-4xl">
            <img 
              src={finalCollage} 
              alt="Optimal collage"
              className="w-full h-auto rounded-lg shadow-2xl"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex gap-4">
              <a
                href={finalCollage}
                download="optimal-collage.jpg"
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
