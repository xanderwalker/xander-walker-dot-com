import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface CameraDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
  facing: 'user' | 'environment' | 'unknown';
}

interface Flower {
  id: number;
  x: number;
  y: number;
  vy: number;
  imageData: string;
  rotation: number;
  settled: boolean;
  size: number;
}

export default function CameraKaleidoscope() {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<CameraDevice | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [screenFull, setScreenFull] = useState(false);
  const [finalScreenshot, setFinalScreenshot] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
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
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);
  const flowerIdRef = useRef(0);

  // Get available cameras
  const getCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      const cameraDevices: CameraDevice[] = videoDevices.map(device => {
        let facing: 'user' | 'environment' | 'unknown' = 'unknown';
        
        if (device.label.toLowerCase().includes('front') || device.label.toLowerCase().includes('user')) {
          facing = 'user';
        } else if (device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('environment')) {
          facing = 'environment';
        }
        
        return {
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
          kind: device.kind,
          facing
        };
      });
      
      setCameras(cameraDevices);
    } catch (error) {
      console.error('Error getting cameras:', error);
    }
  }, []);

  // Request camera permission and get camera list
  const requestCameraPermission = async () => {
    try {
      // Request permission by trying to access camera
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      tempStream.getTracks().forEach(track => track.stop());
      
      setHasPermission(true);
      await getCameras();
    } catch (error) {
      console.error('Camera permission denied:', error);
      setHasPermission(false);
    }
  };

  // Start camera with selected device
  const startCamera = async (camera: CameraDevice) => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: camera.deviceId,
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      setStream(newStream);
      setSelectedCamera(camera);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (error) {
      console.error('Error starting camera:', error);
    }
  };

  // Create kaleidoscope effect from image
  const createKaleidoscope = (sourceCanvas: HTMLCanvasElement): string => {
    const ctx = sourceCanvas.getContext('2d')!;
    const size = 200;
    
    // Create kaleidoscope canvas
    const kaleidoCanvas = document.createElement('canvas');
    kaleidoCanvas.width = size;
    kaleidoCanvas.height = size;
    const kaleidoCtx = kaleidoCanvas.getContext('2d')!;
    
    // Get center triangle from source
    const centerX = sourceCanvas.width / 2;
    const centerY = sourceCanvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.8;
    
    // Draw 6-fold symmetry kaleidoscope
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      
      kaleidoCtx.save();
      kaleidoCtx.translate(size / 2, size / 2);
      kaleidoCtx.rotate(angle);
      
      // Create triangular clip path
      kaleidoCtx.beginPath();
      kaleidoCtx.moveTo(0, 0);
      kaleidoCtx.lineTo(size / 2, 0);
      kaleidoCtx.lineTo(size / 4, size / 4);
      kaleidoCtx.closePath();
      kaleidoCtx.clip();
      
      // Draw source image section
      kaleidoCtx.drawImage(
        sourceCanvas,
        centerX - radius, centerY - radius, radius * 2, radius * 2,
        -size / 4, -size / 4, size / 2, size / 2
      );
      
      kaleidoCtx.restore();
    }
    
    // Add flower-like overlay
    kaleidoCtx.globalCompositeOperation = 'overlay';
    const gradient = kaleidoCtx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    gradient.addColorStop(0, 'rgba(255, 192, 203, 0.3)'); // Light pink
    gradient.addColorStop(0.5, 'rgba(255, 105, 180, 0.2)'); // Hot pink
    gradient.addColorStop(1, 'rgba(139, 69, 19, 0.1)'); // Brown edge
    
    kaleidoCtx.fillStyle = gradient;
    kaleidoCtx.beginPath();
    kaleidoCtx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
    kaleidoCtx.fill();
    
    return kaleidoCanvas.toDataURL();
  };

  // Take photo and create flower
  const takePhoto = useCallback(() => {
    if (!videoRef.current || !hiddenCanvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = hiddenCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame
    ctx.drawImage(video, 0, 0);
    
    // Create kaleidoscope flower
    const flowerImageData = createKaleidoscope(canvas);
    
    // Create new flower object
    const newFlower: Flower = {
      id: flowerIdRef.current++,
      x: Math.random() * (window.innerWidth - 200),
      y: -200,
      vy: 2 + Math.random() * 3,
      imageData: flowerImageData,
      rotation: Math.random() * 360,
      settled: false,
      size: 150 + Math.random() * 100
    };
    
    setFlowers(prev => [...prev, newFlower]);
  }, []);

  // Start capture process
  const startCapture = () => {
    setIsCapturing(true);
    
    // Take photo every second
    intervalRef.current = setInterval(() => {
      takePhoto();
    }, 1000);
    
    // Start animation loop for falling flowers
    const animate = () => {
      setFlowers(prev => {
        const updated = prev.map(flower => {
          if (flower.settled) return flower;
          
          let newY = flower.y + flower.vy;
          let newSettled = false;
          
          // Check if flower hits bottom or other flowers
          const flowerBottom = newY + flower.size;
          if (flowerBottom >= window.innerHeight) {
            newY = window.innerHeight - flower.size;
            newSettled = true;
          } else {
            // Check collision with other settled flowers
            for (const other of prev) {
              if (other.id === flower.id || !other.settled) continue;
              
              const dx = flower.x - other.x;
              const dy = newY - other.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const minDistance = (flower.size + other.size) / 2;
              
              if (distance < minDistance) {
                newY = other.y - flower.size;
                newSettled = true;
                break;
              }
            }
          }
          
          return {
            ...flower,
            y: newY,
            settled: newSettled
          };
        });
        
        // Check if screen is full (80% covered)
        const settledFlowers = updated.filter(f => f.settled);
        const totalFlowerArea = settledFlowers.reduce((sum, f) => sum + (f.size * f.size), 0);
        const screenArea = window.innerWidth * window.innerHeight;
        
        if (totalFlowerArea > screenArea * 0.6) {
          setScreenFull(true);
        }
        
        return updated;
      });
      
      if (!screenFull) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animate();
  };

  // Take final screenshot
  const takeScreenshot = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const screenshot = canvas.toDataURL('image/png');
    setFinalScreenshot(screenshot);
    
    // Save to gallery
    setSaveStatus('saving');
    saveSubmissionMutation.mutate({
      imageData: screenshot,
      flowerCount: flowers.length
    });
    
    // Stop camera
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    // Clear intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, [stream, saveSubmissionMutation, flowers.length]);

  // Effect to take screenshot when screen is full
  useEffect(() => {
    if (screenFull) {
      setTimeout(() => {
        takeScreenshot();
      }, 1000); // Wait a moment for final flowers to settle
    }
  }, [screenFull, takeScreenshot]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [stream]);

  // Canvas drawing effect
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const drawFlowers = () => {
      // Clear canvas
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw flowers
      let loadedCount = 0;
      const totalFlowers = flowers.length;
      
      if (totalFlowers === 0) return;
      
      flowers.forEach(flower => {
        const img = new Image();
        img.onload = () => {
          ctx.save();
          ctx.translate(flower.x + flower.size/2, flower.y + flower.size/2);
          ctx.rotate((flower.rotation * Math.PI) / 180);
          ctx.drawImage(img, -flower.size/2, -flower.size/2, flower.size, flower.size);
          ctx.restore();
          
          loadedCount++;
          if (loadedCount === totalFlowers) {
            // All flowers loaded and drawn
          }
        };
        img.src = flower.imageData;
      });
    };
    
    drawFlowers();
  }, [flowers]);

  return (
    <div 
      className="min-h-screen bg-black text-white overflow-hidden relative"
      style={{
        fontFamily: 'Georgia, "Times New Roman", Times, serif',
        touchAction: 'manipulation',
        userSelect: 'none'
      }}
    >
      {/* Navigation - only show if not capturing */}
      {!isCapturing && !finalScreenshot && (
        <div className="absolute top-4 left-4 z-50">
          <Link href="/projects">
            <button className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors">
              ← Projects
            </button>
          </Link>
        </div>
      )}

      {/* Hidden video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="hidden"
      />

      {/* Hidden canvas for photo capture */}
      <canvas ref={hiddenCanvasRef} className="hidden" />

      {/* Main canvas for flower display */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* UI overlay */}
      {!isCapturing && !finalScreenshot && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/50">
          <div className="text-center p-8 bg-white/10 backdrop-blur-lg rounded-2xl max-w-md mx-4">
            <h1 className="text-3xl font-bold mb-6">Camera Kaleidoscope</h1>
            
            {hasPermission === null && (
              <div>
                <p className="mb-6">This app will capture photos every second and turn them into falling kaleidoscope flowers.</p>
                <button
                  onClick={requestCameraPermission}
                  className="px-6 py-3 bg-pink-600 hover:bg-pink-700 rounded-lg text-white font-semibold transition-colors"
                >
                  Enable Camera
                </button>
              </div>
            )}

            {hasPermission === false && (
              <div>
                <p className="text-red-400 mb-4">Camera permission denied. Please allow camera access and refresh the page.</p>
              </div>
            )}

            {hasPermission === true && cameras.length === 0 && (
              <div>
                <p>Loading cameras...</p>
              </div>
            )}

            {hasPermission === true && cameras.length > 0 && !selectedCamera && (
              <div>
                <p className="mb-4">Select a camera:</p>
                <div className="space-y-2">
                  {cameras.map((camera) => (
                    <button
                      key={camera.deviceId}
                      onClick={() => startCamera(camera)}
                      className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
                    >
                      {camera.label} ({camera.facing === 'user' ? 'Front' : camera.facing === 'environment' ? 'Rear' : 'Unknown'})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedCamera && !isCapturing && (
              <div>
                <p className="mb-4">Camera ready: {selectedCamera.label}</p>
                <button
                  onClick={startCapture}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold transition-colors"
                >
                  Start Creating Flowers
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Capturing indicator */}
      {isCapturing && !screenFull && (
        <div className="absolute top-4 right-4 z-50">
          <div className="px-4 py-2 bg-red-600 rounded-lg text-white">
            Creating flowers... ({flowers.length})
          </div>
        </div>
      )}

      {/* Final screenshot display */}
      {finalScreenshot && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/90">
          <div className="text-center p-8 bg-white/10 backdrop-blur-lg rounded-2xl max-w-2xl mx-4">
            <h2 className="text-2xl font-bold mb-4">Garden Complete!</h2>
            <p className="mb-4">Your kaleidoscope flower garden has been created with {flowers.length} flowers.</p>
            
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
                src={finalScreenshot} 
                alt="Final flower garden" 
                className="max-w-full max-h-96 rounded-lg mx-auto"
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4 justify-center">
                <a
                  href={finalScreenshot}
                  download="kaleidoscope-garden.png"
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold transition-colors"
                >
                  Download Image
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