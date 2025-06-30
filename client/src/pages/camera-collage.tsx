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
  const [captureCountdown, setCaptureCountdown] = useState<number | null>(null);
  
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

  // Create collage from 4 photos
  const createCollage = useCallback((photos: CapturedPhoto[]) => {
    if (photos.length !== 4 || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    
    // Set collage size
    const collageWidth = 800;
    const collageHeight = 800;
    canvas.width = collageWidth;
    canvas.height = collageHeight;
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, collageWidth, collageHeight);
    
    let loadedCount = 0;
    
    photos.forEach((photo, index) => {
      const img = new Image();
      img.onload = () => {
        // Calculate the quarter section to use from each photo
        const sourceHeight = img.height / 4;
        const sourceY = sourceHeight * index;
        
        // Calculate destination position (each quarter takes up 1/4 of the collage height)
        const destY = (collageHeight / 4) * index;
        const destHeight = collageHeight / 4;
        
        // Draw the quarter section
        ctx.drawImage(
          img,
          0, sourceY, img.width, sourceHeight, // Source: full width, 1/4 height at appropriate position
          0, destY, collageWidth, destHeight    // Destination: full width, 1/4 height
        );
        
        loadedCount++;
        if (loadedCount === 4) {
          // All photos processed, create final collage
          const collageData = canvas.toDataURL('image/jpeg', 0.9);
          setFinalCollage(collageData);
          
          // Save to gallery
          setSaveStatus('saving');
          saveSubmissionMutation.mutate({
            imageData: collageData,
            flowerCount: 4 // Use 4 for photo count
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

  // Start capture sequence
  const startCaptureSequence = () => {
    setIsCapturing(true);
    setCapturedPhotos([]);
    setCaptureCountdown(3);
    
    // Countdown
    const countdownInterval = setInterval(() => {
      setCaptureCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownInterval);
          setCaptureCountdown(null);
          
          // Start taking photos
          let photoCount = 0;
          const captureInterval = setInterval(() => {
            const photoData = takePhoto();
            if (photoData) {
              const newPhoto: CapturedPhoto = {
                id: photoCount,
                imageData: photoData,
                timestamp: Date.now()
              };
              
              setCapturedPhotos(prev => {
                const updated = [...prev, newPhoto];
                if (updated.length === 4) {
                  clearInterval(captureInterval);
                  createCollage(updated);
                }
                return updated;
              });
              
              photoCount++;
            }
          }, 1000); // Take photo every second
          
          captureTimeoutRef.current = captureInterval;
          return null;
        }
        return prev - 1;
      });
    }, 1000);
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

      {/* Hidden video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="hidden"
      />

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera selection and controls */}
      {!isCapturing && !finalCollage && (
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
          <h1 className="text-4xl font-bold mb-8 text-center">4-Photo Collage</h1>
          <p className="text-xl mb-8 text-center max-w-2xl">
            Create a unique collage from 4 consecutive photos. Each photo contributes one quarter (top, upper-middle, lower-middle, bottom) to the final collage.
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
          
          {/* Start capture button */}
          <button
            onClick={startCaptureSequence}
            className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-lg text-white text-xl font-semibold transition-colors"
          >
            Start 4-Photo Collage
          </button>
        </div>
      )}

      {/* Countdown display */}
      {captureCountdown !== null && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-8xl font-bold text-white">
            {captureCountdown}
          </div>
        </div>
      )}

      {/* Capture progress */}
      {isCapturing && captureCountdown === null && !finalCollage && (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
          <div className="text-4xl font-bold mb-8">Taking Photos...</div>
          <div className="text-2xl mb-4">Photo {capturedPhotos.length + 1} of 4</div>
          <div className="w-64 bg-gray-700 rounded-full h-4 mb-8">
            <div 
              className="bg-green-500 h-4 rounded-full transition-all duration-1000"
              style={{ width: `${(capturedPhotos.length / 4) * 100}%` }}
            />
          </div>
          
          {/* Show captured photos */}
          <div className="flex gap-4">
            {capturedPhotos.map((photo, index) => (
              <div key={photo.id} className="w-20 h-20 border-2 border-white rounded-lg overflow-hidden">
                <img src={photo.imageData} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
            {Array.from({ length: 4 - capturedPhotos.length }).map((_, index) => (
              <div key={`empty-${index}`} className="w-20 h-20 border-2 border-gray-500 border-dashed rounded-lg" />
            ))}
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