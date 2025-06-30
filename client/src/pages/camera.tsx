import { Link } from 'wouter';
import { useState, useEffect, useRef } from 'react';
import Layout from '../components/layout';

interface CameraDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
  facing: 'user' | 'environment' | 'unknown';
}

export default function Camera() {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [activeCamera, setActiveCamera] = useState<CameraDevice | null>(null);
  const [permissions, setPermissions] = useState({ camera: false });
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Detect available cameras
  const detectCameras = async () => {
    try {
      // Request camera permission first
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop()); // Stop immediately after getting permission
      setPermissions({ camera: true });

      // Get all available media devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        console.log('No camera devices found');
        return;
      }

      const cameraDevices: CameraDevice[] = [];
      
      // Create camera device objects
      for (const device of videoDevices) {
        // Determine camera facing direction from label
        let facing: 'user' | 'environment' | 'unknown' = 'unknown';
        const label = device.label.toLowerCase();
        
        if (label.includes('front') || label.includes('user') || label.includes('facetime')) {
          facing = 'user';
        } else if (label.includes('back') || label.includes('rear') || label.includes('environment')) {
          facing = 'environment';
        }

        const cameraDevice: CameraDevice = {
          deviceId: device.deviceId,
          label: device.label || `Camera ${cameraDevices.length + 1}`,
          kind: device.kind,
          facing
        };

        cameraDevices.push(cameraDevice);
      }

      setCameras(cameraDevices);
      
    } catch (error) {
      console.error('Camera detection failed:', error);
      setPermissions({ camera: false });
    }
  };

  // Switch to a specific camera
  const switchToCamera = async (targetCamera: CameraDevice) => {
    try {
      // Stop current camera if active
      if (currentStream) {
        currentStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }

      const constraints = {
        video: {
          deviceId: { exact: targetCamera.deviceId },
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCurrentStream(stream);
      setActiveCamera(targetCamera);

      // Start video stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

    } catch (error) {
      console.error(`Failed to switch to camera ${targetCamera.label}:`, error);
    }
  };

  // Stop current camera
  const stopCamera = () => {
    if (currentStream) {
      currentStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
    }
    setCurrentStream(null);
    setActiveCamera(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Initialize cameras on component mount
  useEffect(() => {
    detectCameras();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [currentStream]);

  return (
    <Layout title="CAMERA SYSTEM" subtitle="Single camera switching due to hardware limitations">
      <div className="min-h-screen p-6">
        {/* Navigation */}
        <div className="mb-8 text-center">
          <Link 
            to="/projects" 
            className="inline-block px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl transition-all duration-300  text-lg"
            style={{fontFamily: 'Georgia, serif'}}
          >
            ← Back to Projects
          </Link>
        </div>

        {/* Camera System Container */}
        <div className="max-w-4xl mx-auto">
          <div className="glassmorphism rounded-2xl p-8">
            <h1 className=" text-3xl mb-6 text-center" style={{fontFamily: 'Georgia, serif'}}>
              CAMERA SYSTEM
            </h1>
            
            {/* Hardware Limitation Notice */}
            <div className="mb-6 p-4 bg-blue-100/20 rounded-lg text-center">
              <div className=" text-lg mb-2" style={{fontFamily: 'Georgia, serif'}}>
                Hardware Limitation Notice
              </div>
              <div className=" text-sm" style={{fontFamily: 'Georgia, serif'}}>
                Mobile devices can only access one camera at a time. Switch between available cameras using the buttons below.
              </div>
            </div>
            
            {/* Permission Status */}
            <div className="text-center mb-6">
              <div className={`inline-block px-4 py-2 rounded-lg text-sm  ${
                permissions.camera ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
              }`} style={{fontFamily: 'Georgia, serif'}}>
                Camera Permission: {permissions.camera ? 'Granted' : 'Denied'}
              </div>
            </div>

            {/* Camera Detection Info */}
            <div className="text-center mb-6 " style={{fontFamily: 'Georgia, serif'}}>
              {cameras.length > 0 ? (
                <>
                  <div className="text-lg mb-4">Detected {cameras.length} camera(s)</div>
                  
                  {/* Camera Switcher Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {cameras.map((camera) => (
                      <button
                        key={camera.deviceId}
                        onClick={() => switchToCamera(camera)}
                        className={`p-4 rounded-lg transition-all duration-300  ${
                          activeCamera?.deviceId === camera.deviceId
                            ? 'bg-green-600 text-white'
                            : 'bg-white/10 hover:bg-white/20'
                        }`}
                        style={{fontFamily: 'Georgia, serif'}}
                      >
                        <div className="font-semibold">{camera.label}</div>
                        <div className="text-sm opacity-75">
                          {camera.facing === 'user' ? 'Front Camera' : 
                           camera.facing === 'environment' ? 'Rear Camera' : 'Unknown Position'}
                        </div>
                        {activeCamera?.deviceId === camera.deviceId && (
                          <div className="text-xs mt-1">● ACTIVE</div>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-gray-400">No cameras detected or permission denied</div>
              )}
            </div>

            {/* Control Buttons */}
            {cameras.length > 0 && (
              <div className="flex justify-center space-x-4 mb-8">
                <button
                  onClick={stopCamera}
                  disabled={!activeCamera}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg disabled:bg-gray-400 hover:bg-red-700 transition-colors "
                  style={{fontFamily: 'Georgia, serif'}}
                >
                  Stop Camera
                </button>
              </div>
            )}
            
            {/* Video Feed */}
            <div className="flex justify-center">
              <div className="bg-black rounded-lg overflow-hidden shadow-2xl max-w-2xl w-full">
                {activeCamera && (
                  <div className="p-3 bg-gray-800 text-white text-center " style={{fontFamily: 'Georgia, serif'}}>
                    <div className="font-semibold">{activeCamera.label}</div>
                    <div className="text-xs opacity-75">
                      {activeCamera.facing === 'user' ? 'Front Camera' : 
                       activeCamera.facing === 'environment' ? 'Rear Camera' : 'Unknown Position'}
                    </div>
                  </div>
                )}
                <video
                  ref={videoRef}
                  className="w-full h-80 object-cover bg-gray-900"
                  autoPlay
                  playsInline
                  muted
                />
                <div className="p-2 bg-gray-800 text-white text-xs text-center " style={{fontFamily: 'Georgia, serif'}}>
                  {activeCamera ? 'Live Stream' : 'No Camera Selected'}
                </div>
              </div>
            </div>

            {/* No Cameras Message */}
            {cameras.length === 0 && permissions.camera && (
              <div className="text-center text-gray-400 " style={{fontFamily: 'Georgia, serif'}}>
                <div className="text-xl mb-2">No cameras detected</div>
                <div className="text-sm">This device may not have any cameras available</div>
              </div>
            )}

            {/* Permission Denied Message */}
            {!permissions.camera && (
              <div className="text-center text-red-400 " style={{fontFamily: 'Georgia, serif'}}>
                <div className="text-xl mb-2">Camera access denied</div>
                <div className="text-sm">Please allow camera access to use this feature</div>
                <button
                  onClick={detectCameras}
                  className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Request Camera Permission
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}