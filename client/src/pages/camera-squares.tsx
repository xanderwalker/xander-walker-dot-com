import { useState, useRef, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, Download, Grid3X3, Square } from 'lucide-react';
import Layout from '@/components/layout';

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

export default function CameraSquares() {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<CameraDevice | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [finalCollage, setFinalCollage] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

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

  // Auto-start removed to prevent conflicts

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

  // Create square grid collage from 100 photos (10x10 grid)
  const createSquareCollage = useCallback((photos: CapturedPhoto[]) => {
    if (photos.length !== 100 || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    
    const collageWidth = 1000;
    const collageHeight = 1000;
    canvas.width = collageWidth;
    canvas.height = collageHeight;
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, collageWidth, collageHeight);
    
    // Calculate square dimensions for 10x10 grid
    const cols = 10;
    const rows = 10;
    const squareSize = collageWidth / cols; // Perfect squares with no gaps
    
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
        
        // Calculate destination position (perfect grid with no gaps)
        const destX = col * squareSize;
        const destY = row * squareSize;
        
        // Draw the photo section as a perfect square
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,
          destX, destY, squareSize, squareSize
        );
        
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
  }, [stream]);

  const { data: submissions } = useQuery({
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

  const startCapture = () => {
    if (!stream) return;
    
    setIsCapturing(true);
    setCapturedPhotos([]);
    
    let photoCount = 0;
    
    const captureSequence = () => {
      if (photoCount >= 100) {
        setIsCapturing(false);
        return;
      }
      
      const imageData = capturePhoto();
      if (imageData) {
        const newPhoto: CapturedPhoto = {
          id: photoCount + 1,
          imageData,
          timestamp: Date.now()
        };
        
        setCapturedPhotos(prev => {
          const updated = [...prev, newPhoto];
          
          // Create collage when we have all 100 photos
          if (updated.length === 100) {
            setTimeout(() => createSquareCollage(updated), 100);
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

  const downloadImage = () => {
    if (!finalCollage) return;
    
    const link = document.createElement('a');
    link.download = `square-collage-${Date.now()}.jpg`;
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

  return (
    <Layout title="RAPID SQUARE CAMERA">
      <div className="relative min-h-screen bg-black text-white overflow-hidden">
        
        {/* Live viewfinder */}
        {stream && !isCapturing && !finalCollage && (
          <div className="fixed inset-0 z-10">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Live Square Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 10 10">
                {Array.from({ length: 100 }, (_, i) => {
                  const col = i % 10;
                  const row = Math.floor(i / 10);
                  
                  const captured = i < capturedPhotos.length;
                  const current = i === capturedPhotos.length && isCapturing;

                  return (
                    <rect
                      key={i}
                      x={col}
                      y={row}
                      width={0.95}
                      height={0.95}
                      fill={captured ? 'rgba(59, 130, 246, 0.3)' : current ? 'rgba(255, 255, 0, 0.5)' : 'none'}
                      stroke={captured ? 'rgba(59, 130, 246, 0.8)' : current ? 'rgba(255, 255, 0, 1)' : 'rgba(255, 255, 255, 0.3)'}
                      strokeWidth="0.02"
                    />
                  );
                })}
              </svg>
            </div>
            
            {/* Capture button */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
              <Button
                onClick={startCapture}
                size="lg"
                className="w-20 h-20 rounded-full bg-white text-black hover:bg-gray-200 border-4 border-gray-300"
              >
                <Camera className="w-8 h-8" />
              </Button>
            </div>
            
            {/* Camera selection */}
            <div className="absolute top-4 right-4 z-20">
              <select
                value={selectedCamera?.deviceId || ''}
                onChange={(e) => {
                  const camera = cameras.find(c => c.deviceId === e.target.value);
                  if (camera) setSelectedCamera(camera);
                }}
                className="bg-black/50 text-white border border-white/30 rounded px-3 py-2"
              >
                {cameras.map((camera) => (
                  <option key={camera.deviceId} value={camera.deviceId}>
                    {camera.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Photo counter */}
            <div className="absolute top-4 left-4 z-20">
              <div className="bg-black/50 text-white px-4 py-2 rounded">
                <div className="flex items-center gap-2">
                  <Square className="w-5 h-5" />
                  <span>100-Square Grid</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Capturing progress */}
        {isCapturing && (
          <div className="fixed inset-0 z-30 bg-black flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl font-bold mb-4">{capturedPhotos.length}</div>
              <div className="text-2xl mb-8">/ 100 SQUARES</div>
              <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-100"
                  style={{ width: `${(capturedPhotos.length / 100) * 100}%` }}
                />
              </div>
              <div className="text-lg mt-4">Capturing at 100fps...</div>
            </div>
          </div>
        )}

        {/* Final result */}
        {finalCollage && (
          <div className="fixed inset-0 z-30 bg-black flex flex-col items-center justify-center p-4">
            <h2 className="text-3xl font-bold mb-4">Your 100-square composite has been created.</h2>
            
            {saveStatus === 'saving' && (
              <div className="text-yellow-400 mb-4">💾 Saving to gallery...</div>
            )}
            {saveStatus === 'saved' && (
              <div className="text-green-400 mb-4">✅ Saved to gallery</div>
            )}
            {saveStatus === 'error' && (
              <div className="text-red-400 mb-4">❌ Failed to save to gallery</div>
            )}
            
            <div className="max-w-md max-h-96 mb-6">
              <img 
                src={finalCollage} 
                alt="Square Collage"
                className="w-full h-full object-contain rounded-lg shadow-2xl"
              />
            </div>
            
            <div className="flex gap-4">
              <Button onClick={downloadImage} className="bg-green-600 hover:bg-green-700">
                <Download className="w-4 h-4 mr-2" />
                Download Collage
              </Button>
              
              <Button onClick={() => window.location.href = '/projects/kaleidoscope-gallery'} className="bg-purple-600 hover:bg-purple-700">
                <Grid3X3 className="w-4 h-4 mr-2" />
                View Gallery
              </Button>
              
              <Button onClick={() => window.location.href = '/projects/cameras'} className="bg-blue-600 hover:bg-blue-700">
                <Camera className="w-4 h-4 mr-2" />
                Back to Cameras
              </Button>
            </div>
          </div>
        )}

        {/* Camera selection and controls */}
        {!isCapturing && !finalCollage && (
          <div className="flex flex-col items-center justify-center min-h-screen p-8">
            <h1 className="text-4xl font-bold mb-8 text-center">100-Shot Square Grid</h1>
            <p className="text-xl mb-8 text-center max-w-2xl">
              Click the shutter button to automatically capture 100 photos in sequence (100 per second). Each photo contributes one square section to create a perfect 10x10 grid composite.
            </p>
            
            {hasPermission === false && (
              <div className="text-center mb-8">
                <p className="text-red-400 mb-4">Camera permission is required</p>
                <Button 
                  onClick={initializeCameras}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Camera className="w-6 h-6 mr-2" />
                  Grant Camera Permission
                </Button>
              </div>
            )}
            
            {/* Camera selection */}
            {cameras.length > 0 && hasPermission !== false && (
              <Card className="bg-gray-900 border-gray-700 p-6 mb-6">
                <div className="flex flex-col items-center gap-4">
                  <h3 className="text-lg font-semibold">Select Camera</h3>
                  <div className="grid gap-2 w-full">
                    {cameras.map((camera) => (
                      <Button
                        key={camera.deviceId}
                        onClick={() => setSelectedCamera(camera)}
                        variant={selectedCamera?.deviceId === camera.deviceId ? "default" : "outline"}
                        className="w-full justify-start"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        {camera.label}
                        {camera.facing !== 'unknown' && (
                          <span className="ml-auto text-sm opacity-70">
                            ({camera.facing})
                          </span>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Square Pattern Preview */}
            {selectedCamera && (
              <Card className="bg-gray-900 border-gray-700 p-6 mb-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-4">Square Grid Pattern Preview</h3>
                  
                  <div className="aspect-square bg-black rounded-lg p-4 max-w-xs mx-auto">
                    <svg className="w-full h-full" viewBox="0 0 10 10">
                      {Array.from({ length: 100 }, (_, i) => {
                        const col = i % 10;
                        const row = Math.floor(i / 10);

                        return (
                          <rect
                            key={i}
                            x={col}
                            y={row}
                            width={0.9}
                            height={0.9}
                            fill="rgba(59, 130, 246, 0.3)"
                            stroke="rgba(59, 130, 246, 0.8)"
                            strokeWidth="0.02"
                          />
                        );
                      })}
                    </svg>
                  </div>
                  
                  <div className="text-sm text-gray-300 mt-4">
                    100 perfect squares in 10×10 grid
                  </div>
                </div>
              </Card>
            )}

            {!stream && selectedCamera && hasPermission !== false && (
              <Button 
                onClick={() => startCamera(selectedCamera)}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Camera className="w-6 h-6 mr-2" />
                Start Camera
              </Button>
            )}
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </Layout>
  );
}