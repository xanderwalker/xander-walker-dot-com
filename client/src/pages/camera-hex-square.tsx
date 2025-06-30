import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '../components/layout';

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
  const [activeCamera, setActiveCamera] = useState<CameraDevice | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalComposite, setFinalComposite] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number>(4/3);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const TOTAL_FRAMES = 64; // 8x8 grid
  const CAPTURE_FPS = 8;
  const CAPTURE_INTERVAL = 1000 / CAPTURE_FPS;

  useEffect(() => {
    initializeCameras();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initializeCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      const cameraDevices: CameraDevice[] = videoDevices.map(device => {
        const cameraDevice: CameraDevice = {
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.substring(0, 8)}`,
          kind: device.kind,
          facing: 'unknown'
        };

        if (device.label.toLowerCase().includes('front') || device.label.toLowerCase().includes('user')) {
          cameraDevice.facing = 'user';
        } else if (device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('environment')) {
          cameraDevice.facing = 'environment';
        }

        return cameraDevice;
      });

      setCameras(cameraDevices);
      if (cameraDevices.length > 0) {
        await startCamera(cameraDevices[0]);
      }
    } catch (error) {
      console.error('Error accessing cameras:', error);
    }
  };

  const startCamera = async (camera: CameraDevice) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: camera.deviceId,
          width: { ideal: 1920 },
          height: { ideal: 1440 }
        }
      });

      streamRef.current = stream;
      setActiveCamera(camera);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            const videoAspectRatio = videoRef.current.videoWidth / videoRef.current.videoHeight;
            setAspectRatio(videoAspectRatio);
          }
        };
      }
    } catch (error) {
      console.error('Error starting camera:', error);
    }
  };

  const capturePhoto = (): string => {
    if (!videoRef.current || !canvasRef.current) return '';

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const startCapture = async () => {
    if (!videoRef.current || isCapturing) return;

    setIsCapturing(true);
    setCurrentFrame(0);
    setCapturedPhotos([]);
    setFinalComposite(null);

    let frameCount = 0;
    const captureInterval = setInterval(() => {
      const imageData = capturePhoto();
      
      if (imageData) {
        const newPhoto: CapturedPhoto = {
          id: frameCount,
          imageData,
          timestamp: Date.now()
        };

        setCapturedPhotos(prev => [...prev, newPhoto]);
        setCurrentFrame(frameCount + 1);
      }

      frameCount++;

      if (frameCount >= TOTAL_FRAMES) {
        clearInterval(captureInterval);
        setIsCapturing(false);
        setTimeout(() => processComposite(), 500);
      }
    }, CAPTURE_INTERVAL);
  };

  const processComposite = async () => {
    if (capturedPhotos.length !== TOTAL_FRAMES) return;

    setIsProcessing(true);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match aspect ratio
    const canvasWidth = 800;
    const canvasHeight = Math.round(canvasWidth / aspectRatio);
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const gridCols = 8;
    const gridRows = 8;
    const sectionWidth = canvasWidth / gridCols;
    const sectionHeight = canvasHeight / gridRows;

    // Process each photo and place it in the correct position
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const photo = capturedPhotos[i];
      if (!photo) continue;

      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = photo.imageData;
      });

      // Calculate grid position
      const col = i % gridCols;
      const row = Math.floor(i / gridCols);

      // Determine if this position should be hex or square based on alternating pattern
      const isHex = (row + col) % 2 === 0;

      // Calculate source coordinates (what part of the photo to extract)
      const sourceWidth = img.width / gridCols;
      const sourceHeight = img.height / gridRows;
      const sourceX = col * sourceWidth;
      const sourceY = row * sourceHeight;

      // Calculate destination coordinates (where to place on final canvas)
      const destX = col * sectionWidth;
      const destY = row * sectionHeight;

      if (isHex) {
        // Create hexagonal clip path
        ctx.save();
        ctx.beginPath();
        const centerX = destX + sectionWidth / 2;
        const centerY = destY + sectionHeight / 2;
        const radius = Math.min(sectionWidth, sectionHeight) / 2 * 0.9;
        
        for (let j = 0; j < 6; j++) {
          const angle = (j * Math.PI) / 3;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          if (j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.clip();
      } else {
        // Create square clip path (slightly smaller for visual separation)
        ctx.save();
        const margin = Math.min(sectionWidth, sectionHeight) * 0.05;
        ctx.beginPath();
        ctx.rect(destX + margin, destY + margin, sectionWidth - 2*margin, sectionHeight - 2*margin);
        ctx.clip();
      }

      // Draw the photo section
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceWidth, sourceHeight,
        destX, destY, sectionWidth, sectionHeight
      );

      ctx.restore();
    }

    const finalImageData = canvas.toDataURL('image/jpeg', 0.9);
    setFinalComposite(finalImageData);
    setIsProcessing(false);

    // Auto-save to gallery
    setTimeout(() => {
      setShowGallery(true);
    }, 1000);
  };

  const resetCapture = () => {
    setCapturedPhotos([]);
    setCurrentFrame(0);
    setFinalComposite(null);
    setShowGallery(false);
  };

  const downloadComposite = () => {
    if (!finalComposite) return;

    const link = document.createElement('a');
    link.download = `hex-square-composite-${Date.now()}.jpg`;
    link.href = finalComposite;
    link.click();
  };

  if (showGallery && finalComposite) {
    return (
      <Layout title="HYBRID TESSELLATION CAMERA">
        <div className="min-h-screen bg-black text-white p-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}>
              HEX-SQUARE COMPOSITE COMPLETE
            </h1>
            
            <div className="mb-6">
              <img 
                src={finalComposite} 
                alt="Hex-Square Composite" 
                className="w-full max-w-2xl mx-auto rounded-lg shadow-2xl"
              />
            </div>

            <div className="flex gap-4 justify-center mb-6">
              <Button 
                onClick={downloadComposite}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold rounded-lg"
                style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}
              >
                Download Composite
              </Button>
              <Button 
                onClick={resetCapture}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-lg"
                style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}
              >
                Capture New Composite
              </Button>
            </div>

            <p className="text-gray-300 text-lg" style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}>
              64 photos captured in alternating hexagonal and square patterns
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="HYBRID TESSELLATION CAMERA">
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-6xl mx-auto p-4">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}>
              HYBRID TESSELLATION CAMERA
            </h1>
            <p className="text-gray-300 text-lg" style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}>
              Advanced geometric patterns combining hexagonal and square shapes
            </p>
          </div>

          {/* Camera Controls */}
          <div className="mb-6">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  {cameras.map((camera) => (
                    <Button
                      key={camera.deviceId}
                      onClick={() => startCamera(camera)}
                      variant={activeCamera?.deviceId === camera.deviceId ? "default" : "outline"}
                      className={`text-sm ${
                        activeCamera?.deviceId === camera.deviceId 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white/20 text-white border-white/40 hover:bg-white/30'
                      }`}
                      style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}
                    >
                      {camera.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Camera Preview */}
            <div className="space-y-4">
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardContent className="p-4">
                  <div className="aspect-[4/3] bg-black rounded-lg overflow-hidden relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {/* Grid Overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      <svg className="w-full h-full" viewBox="0 0 8 8">
                        {Array.from({ length: 64 }, (_, i) => {
                          const col = i % 8;
                          const row = Math.floor(i / 8);
                          const isHex = (row + col) % 2 === 0;
                          const captured = i < currentFrame;
                          const current = i === currentFrame && isCapturing;

                          if (isHex) {
                            // Hexagon
                            const centerX = col + 0.5;
                            const centerY = row + 0.5;
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
                                fill={captured ? 'rgba(0, 255, 0, 0.3)' : current ? 'rgba(255, 255, 0, 0.5)' : 'none'}
                                stroke={captured ? 'rgba(0, 255, 0, 0.8)' : current ? 'rgba(255, 255, 0, 1)' : 'rgba(255, 255, 255, 0.3)'}
                                strokeWidth="0.02"
                              />
                            );
                          } else {
                            // Square
                            return (
                              <rect
                                key={i}
                                x={col + 0.1}
                                y={row + 0.1}
                                width={0.8}
                                height={0.8}
                                fill={captured ? 'rgba(0, 255, 0, 0.3)' : current ? 'rgba(255, 255, 0, 0.5)' : 'none'}
                                stroke={captured ? 'rgba(0, 255, 0, 0.8)' : current ? 'rgba(255, 255, 0, 1)' : 'rgba(255, 255, 255, 0.3)'}
                                strokeWidth="0.02"
                              />
                            );
                          }
                        })}
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Capture Controls */}
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardContent className="p-4">
                  <div className="text-center space-y-4">
                    <div style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}>
                      <div className="text-2xl font-bold text-white mb-2">
                        {isCapturing ? `Capturing: ${currentFrame}/${TOTAL_FRAMES}` : 
                         isProcessing ? 'Processing Composite...' :
                         finalComposite ? 'Composite Complete!' :
                         'Ready to Capture'}
                      </div>
                      <div className="text-gray-300">
                        {isCapturing ? `${CAPTURE_FPS}fps • ${Math.round((TOTAL_FRAMES - currentFrame) / CAPTURE_FPS)}s remaining` :
                         !isCapturing && !isProcessing && !finalComposite ? '64 photos • 8fps • Hex-Square pattern' :
                         isProcessing ? 'Creating tessellated composite...' :
                         '64 alternating hex and square sections'}
                      </div>
                    </div>

                    <Button
                      onClick={isCapturing ? undefined : startCapture}
                      disabled={isCapturing || isProcessing}
                      className="w-full px-8 py-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold text-xl rounded-lg"
                      style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}
                    >
                      {isCapturing ? 'CAPTURING...' : 
                       isProcessing ? 'PROCESSING...' :
                       'START HEX-SQUARE CAPTURE'}
                    </Button>

                    {finalComposite && (
                      <Button
                        onClick={resetCapture}
                        className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-lg"
                        style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}
                      >
                        Capture New Composite
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress and Preview */}
            <div className="space-y-4">
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardContent className="p-4">
                  <h3 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}>
                    Capture Progress
                  </h3>
                  
                  <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full transition-all duration-300"
                      style={{ width: `${(currentFrame / TOTAL_FRAMES) * 100}%` }}
                    ></div>
                  </div>

                  <div className="text-center text-white" style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}>
                    <div className="text-lg font-bold">
                      {currentFrame} / {TOTAL_FRAMES} frames
                    </div>
                    <div className="text-sm text-gray-300">
                      {Math.round((currentFrame / TOTAL_FRAMES) * 100)}% complete
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pattern Preview */}
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardContent className="p-4">
                  <h3 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}>
                    Hex-Square Pattern
                  </h3>
                  
                  <div className="aspect-square bg-gray-900 rounded-lg p-4">
                    <svg className="w-full h-full" viewBox="0 0 8 8">
                      {Array.from({ length: 64 }, (_, i) => {
                        const col = i % 8;
                        const row = Math.floor(i / 8);
                        const isHex = (row + col) % 2 === 0;

                        if (isHex) {
                          // Hexagon
                          const centerX = col + 0.5;
                          const centerY = row + 0.5;
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
                              fill="rgba(59, 130, 246, 0.3)"
                              stroke="rgba(59, 130, 246, 0.8)"
                              strokeWidth="0.02"
                            />
                          );
                        } else {
                          // Square
                          return (
                            <rect
                              key={i}
                              x={col + 0.1}
                              y={row + 0.1}
                              width={0.8}
                              height={0.8}
                              fill="rgba(16, 185, 129, 0.3)"
                              stroke="rgba(16, 185, 129, 0.8)"
                              strokeWidth="0.02"
                            />
                          );
                        }
                      })}
                    </svg>
                  </div>
                  
                  <div className="text-center mt-4 text-sm text-gray-300" style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}>
                    Blue hexagons alternate with green squares
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </Layout>
  );
}