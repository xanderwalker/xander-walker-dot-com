import { Link } from 'wouter';
import { useState, useEffect, useRef } from 'react';
import Layout from '../components/layout';

interface CameraDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
  facing: 'user' | 'environment' | 'unknown';
  stream?: MediaStream;
}

export default function Camera() {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [camerasActive, setCamerasActive] = useState(false);
  const [permissions, setPermissions] = useState({ camera: false });

  // Detect and initialize all cameras
  const detectAndInitializeCameras = async () => {
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

  // Start all camera streams
  const startAllCameras = async () => {
    if (cameras.length === 0) return;

    const updatedCameras = [...cameras];
    
    for (let i = 0; i < updatedCameras.length; i++) {
      try {
        const constraints = {
          video: {
            deviceId: { exact: updatedCameras[i].deviceId },
            width: { ideal: 480 },
            height: { ideal: 360 }
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        updatedCameras[i].stream = stream;

        // Start video stream
        setTimeout(() => {
          const videoElement = document.getElementById(`camera-${i}`) as HTMLVideoElement;
          if (videoElement && stream) {
            videoElement.srcObject = stream;
            videoElement.play();
          }
        }, 100);

      } catch (error) {
        console.error(`Failed to start camera ${updatedCameras[i].label}:`, error);
      }
    }

    setCameras(updatedCameras);
    setCamerasActive(true);
  };

  // Stop all camera streams
  const stopAllCameras = () => {
    cameras.forEach(camera => {
      if (camera.stream) {
        camera.stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
    });
    
    setCameras(cameras.map(camera => ({ ...camera, stream: undefined })));
    setCamerasActive(false);
  };

  // Initialize cameras on component mount
  useEffect(() => {
    detectAndInitializeCameras();
  }, []);

  return (
    <Layout title="CAMERA SYSTEM" subtitle="Multi-camera detection and live video streams">
      <div className="min-h-screen p-6">
        {/* Navigation */}
        <div className="mb-8 text-center">
          <Link 
            to="/projects" 
            className="inline-block px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl transition-all duration-300 font-serif text-lg"
            style={{fontFamily: 'Georgia, serif'}}
          >
            ← Back to Projects
          </Link>
        </div>

        {/* Camera System Container */}
        <div className="max-w-6xl mx-auto">
          <div className="glassmorphism rounded-2xl p-8">
            <h1 className="font-serif text-3xl mb-6 text-center" style={{fontFamily: 'Georgia, serif'}}>
              CAMERA SYSTEM
            </h1>
            
            {/* Permission Status */}
            <div className="text-center mb-6">
              <div className={`inline-block px-4 py-2 rounded-lg text-sm font-serif ${
                permissions.camera ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
              }`} style={{fontFamily: 'Georgia, serif'}}>
                Camera Permission: {permissions.camera ? 'Granted' : 'Denied'}
              </div>
            </div>

            {/* Camera Detection Info */}
            <div className="text-center mb-6 font-serif" style={{fontFamily: 'Georgia, serif'}}>
              {cameras.length > 0 ? (
                <>
                  <div className="text-lg mb-4">Detected {cameras.length} camera(s)</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {cameras.map((camera, index) => (
                      <div key={camera.deviceId} className="bg-white/10 rounded-lg p-3">
                        <div className="font-semibold">{camera.label}</div>
                        <div className="text-sm opacity-75">
                          {camera.facing === 'user' ? 'Front Camera' : 
                           camera.facing === 'environment' ? 'Rear Camera' : 'Unknown Position'}
                        </div>
                      </div>
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
                  onClick={startAllCameras}
                  disabled={camerasActive}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg disabled:bg-gray-400 hover:bg-green-700 transition-colors font-serif"
                  style={{fontFamily: 'Georgia, serif'}}
                >
                  Start All Cameras
                </button>
                <button
                  onClick={stopAllCameras}
                  disabled={!camerasActive}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg disabled:bg-gray-400 hover:bg-red-700 transition-colors font-serif"
                  style={{fontFamily: 'Georgia, serif'}}
                >
                  Stop All Cameras
                </button>
              </div>
            )}
            
            {/* Camera Video Feeds */}
            {cameras.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cameras.map((camera, index) => (
                  <div key={camera.deviceId} className="bg-black rounded-lg overflow-hidden shadow-2xl">
                    <div className="p-3 bg-gray-800 text-white text-center font-serif" style={{fontFamily: 'Georgia, serif'}}>
                      <div className="font-semibold">{camera.label}</div>
                      <div className="text-xs opacity-75">
                        {camera.facing === 'user' ? 'Front Camera' : 
                         camera.facing === 'environment' ? 'Rear Camera' : 'Unknown Position'}
                      </div>
                    </div>
                    <video
                      id={`camera-${index}`}
                      className="w-full h-64 object-cover bg-gray-900"
                      autoPlay
                      playsInline
                      muted
                    />
                    <div className="p-2 bg-gray-800 text-white text-xs text-center font-serif" style={{fontFamily: 'Georgia, serif'}}>
                      {camerasActive && camera.stream ? 'Live' : 'Stopped'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Cameras Message */}
            {cameras.length === 0 && permissions.camera && (
              <div className="text-center text-gray-400 font-serif" style={{fontFamily: 'Georgia, serif'}}>
                <div className="text-xl mb-2">No cameras detected</div>
                <div className="text-sm">This device may not have any cameras available</div>
              </div>
            )}

            {/* Permission Denied Message */}
            {!permissions.camera && (
              <div className="text-center text-red-400 font-serif" style={{fontFamily: 'Georgia, serif'}}>
                <div className="text-xl mb-2">Camera access denied</div>
                <div className="text-sm">Please allow camera access to use this feature</div>
                <button
                  onClick={detectAndInitializeCameras}
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