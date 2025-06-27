import { Link } from 'wouter';
import { useState, useEffect, useRef } from 'react';

interface SensorData {
  accelerometer: { x: number; y: number; z: number };
  gyroscope: { alpha: number; beta: number; gamma: number };
  compass: number;
  soundLevel: number;
  brightness: number;
  temperature: number;
  pressure: number;
  humidity: number;
  proximity: number;
  battery: { level: number; charging: boolean };
}

export default function SensorDashboard() {
  const [sensorData, setSensorData] = useState<SensorData>({
    accelerometer: { x: 0, y: 0, z: 0 },
    gyroscope: { alpha: 0, beta: 0, gamma: 0 },
    compass: 0,
    soundLevel: 0,
    brightness: 0,
    temperature: 0,
    pressure: 0,
    humidity: 0,
    proximity: 0,
    battery: { level: 0, charging: false }
  });
  
  const [permissions, setPermissions] = useState({
    motion: false,
    audio: false,
    camera: false
  });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number>();

  // Request all sensor permissions
  const requestAllPermissions = async () => {
    try {
      // Motion sensors
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        const motionPermission = await (DeviceMotionEvent as any).requestPermission();
        setPermissions(prev => ({ ...prev, motion: motionPermission === 'granted' }));
      } else {
        setPermissions(prev => ({ ...prev, motion: true }));
      }

      // Audio permission for microphone
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setPermissions(prev => ({ ...prev, audio: true }));
        setupAudioAnalysis(stream);
      } catch (error) {
        console.error('Audio permission denied:', error);
      }

      // Camera permission for ambient light (if available)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop()); // Stop immediately, just testing permission
        setPermissions(prev => ({ ...prev, camera: true }));
      } catch (error) {
        console.error('Camera permission denied:', error);
      }

    } catch (error) {
      console.error('Permission request failed:', error);
    }
  };

  // Setup audio analysis for sound level detection
  const setupAudioAnalysis = (stream: MediaStream) => {
    try {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current.fftSize = 256;
      microphoneRef.current.connect(analyserRef.current);
      
      startAudioAnalysis();
    } catch (error) {
      console.error('Audio setup failed:', error);
    }
  };

  // Analyze audio for sound level
  const startAudioAnalysis = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const analyze = () => {
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const soundLevel = Math.round((average / 255) * 100);
        
        setSensorData(prev => ({ ...prev, soundLevel }));
      }
      animationFrameRef.current = requestAnimationFrame(analyze);
    };
    
    analyze();
  };

  // Setup all sensor listeners
  useEffect(() => {
    if (!permissions.motion) return;

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity;
      if (acceleration) {
        setSensorData(prev => ({
          ...prev,
          accelerometer: {
            x: Math.round((acceleration.x || 0) * 10) / 10,
            y: Math.round((acceleration.y || 0) * 10) / 10,
            z: Math.round((acceleration.z || 0) * 10) / 10
          }
        }));
      }
    };

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      setSensorData(prev => ({
        ...prev,
        gyroscope: {
          alpha: Math.round((event.alpha || 0) * 10) / 10,
          beta: Math.round((event.beta || 0) * 10) / 10,
          gamma: Math.round((event.gamma || 0) * 10) / 10
        },
        compass: Math.round(event.alpha || 0)
      }));
    };

    window.addEventListener('devicemotion', handleDeviceMotion);
    window.addEventListener('deviceorientation', handleDeviceOrientation);

    return () => {
      window.removeEventListener('devicemotion', handleDeviceMotion);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, [permissions.motion]);

  // Monitor battery status
  useEffect(() => {
    const updateBattery = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          setSensorData(prev => ({
            ...prev,
            battery: {
              level: Math.round(battery.level * 100),
              charging: battery.charging
            }
          }));
          
          battery.addEventListener('levelchange', () => {
            setSensorData(prev => ({
              ...prev,
              battery: {
                level: Math.round(battery.level * 100),
                charging: battery.charging
              }
            }));
          });
        } catch (error) {
          console.error('Battery API not available:', error);
        }
      }
    };

    updateBattery();
  }, []);

  // Monitor ambient light (if available)
  useEffect(() => {
    if ('AmbientLightSensor' in window) {
      try {
        const sensor = new (window as any).AmbientLightSensor();
        sensor.addEventListener('reading', () => {
          setSensorData(prev => ({ ...prev, brightness: Math.round(sensor.illuminance) }));
        });
        sensor.start();
        
        return () => sensor.stop();
      } catch (error) {
        console.error('Ambient light sensor not available:', error);
      }
    }
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Visual indicator components
  const AccelerometerArrow = () => {
    const { x, y } = sensorData.accelerometer;
    const angle = Math.atan2(x, y) * (180 / Math.PI);
    const magnitude = Math.min(Math.sqrt(x * x + y * y) * 10, 50);
    
    return (
      <div className="relative w-24 h-24 border-2 border-gray-300 rounded-full flex items-center justify-center">
        <div
          className="absolute w-1 bg-red-500 origin-bottom transition-all duration-200"
          style={{
            height: `${magnitude}px`,
            transform: `rotate(${angle}deg)`,
            bottom: '50%'
          }}
        />
        <div className="w-2 h-2 bg-red-500 rounded-full z-10" />
      </div>
    );
  };

  const CompassArrow = () => {
    return (
      <div className="relative w-24 h-24 border-2 border-gray-300 rounded-full flex items-center justify-center">
        <div className="absolute text-xs text-gray-600 top-1">N</div>
        <div className="absolute text-xs text-gray-600 bottom-1">S</div>
        <div className="absolute text-xs text-gray-600 left-1">W</div>
        <div className="absolute text-xs text-gray-600 right-1">E</div>
        <div
          className="absolute w-1 h-8 bg-blue-500 origin-bottom transition-all duration-300"
          style={{
            transform: `rotate(${sensorData.compass}deg)`,
            bottom: '50%'
          }}
        />
        <div className="w-2 h-2 bg-blue-500 rounded-full z-10" />
      </div>
    );
  };

  const GyroscopeVisualizer = () => {
    const { alpha, beta, gamma } = sensorData.gyroscope;
    
    return (
      <div 
        className="relative w-24 h-24 flex items-center justify-center"
        style={{ perspective: '1000px' }}
      >
        {/* 3D Device representation */}
        <div
          className="w-16 h-20 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg border-2 border-gray-300 transition-all duration-300 relative"
          style={{
            transform: `
              rotateX(${beta * 0.5}deg) 
              rotateY(${gamma * 0.5}deg) 
              rotateZ(${alpha * 0.2}deg)
            `,
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Screen representation */}
          <div className="absolute inset-1 bg-black rounded-sm flex items-center justify-center">
            <div className="w-1 h-1 bg-white rounded-full" />
          </div>
          
          {/* Side indicators for rotation axes */}
          <div className="absolute -top-1 left-1/2 w-0.5 h-2 bg-red-400 transform -translate-x-1/2" />
          <div className="absolute -right-1 top-1/2 w-2 h-0.5 bg-green-400 transform -translate-y-1/2" />
          <div className="absolute -bottom-1 left-1/2 w-0.5 h-2 bg-blue-400 transform -translate-x-1/2" />
        </div>
        
        {/* Rotation rings */}
        <div 
          className="absolute w-20 h-20 border border-red-300 rounded-full opacity-30"
          style={{ transform: `rotateX(${beta * 0.3}deg)` }}
        />
        <div 
          className="absolute w-22 h-22 border border-green-300 rounded-full opacity-30"
          style={{ transform: `rotateY(${gamma * 0.3}deg)` }}
        />
        <div 
          className="absolute w-24 h-24 border border-blue-300 rounded-full opacity-30"
          style={{ transform: `rotateZ(${alpha * 0.2}deg)` }}
        />
      </div>
    );
  };

  const SoundLevelMeter = () => {
    return (
      <div className="w-24 h-4 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 transition-all duration-100"
          style={{ width: `${sensorData.soundLevel}%` }}
        />
      </div>
    );
  };

  const BatteryIndicator = () => {
    const { level, charging } = sensorData.battery;
    return (
      <div className="flex items-center space-x-2">
        <div className="w-12 h-6 border-2 border-gray-400 rounded relative">
          <div className="absolute top-1 right-[-3px] w-1 h-4 bg-gray-400 rounded-r" />
          <div
            className={`h-full rounded transition-all duration-300 ${
              level > 20 ? 'bg-green-400' : 'bg-red-400'
            }`}
            style={{ width: `${level}%` }}
          />
        </div>
        {charging && <span className="text-yellow-500 text-xs">⚡</span>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white text-black p-4">
      {/* Header */}
      <header className="p-4 flex justify-between items-center">
        <Link href="/projects">
          <button className="text-black hover:text-gray-600 transition-colors text-lg font-serif" style={{fontFamily: 'Georgia, serif'}}>
            ← BACK TO PROJECTS
          </button>
        </Link>
        
        <Link href="/">
          <h1 className="text-black font-serif font-bold text-4xl md:text-6xl hover:opacity-70 transition-opacity duration-200 cursor-pointer" style={{fontFamily: 'Georgia, serif'}}>
            XANDER WALKER
          </h1>
        </Link>
        
        <div className="w-48"></div>
      </header>

      {/* Permission Button */}
      <div className="text-center mb-8">
        <button
          onClick={requestAllPermissions}
          className="font-serif bg-blue-500 text-white px-6 py-3 rounded-lg text-lg font-bold hover:bg-blue-600 transition-colors"
          style={{fontFamily: 'Georgia, serif'}}
        >
          ENABLE ALL SENSORS
        </button>
      </div>

      {/* Sensor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        
        {/* Accelerometer */}
        <div className="glassmorphism rounded-2xl p-6">
          <h3 className="font-serif text-xl mb-4 text-center" style={{fontFamily: 'Georgia, serif'}}>ACCELEROMETER</h3>
          <div className="flex flex-col items-center space-y-4">
            <AccelerometerArrow />
            <div className="text-sm space-y-1 text-center font-serif" style={{fontFamily: 'Georgia, serif'}}>
              <div>X: {sensorData.accelerometer.x} m/s²</div>
              <div>Y: {sensorData.accelerometer.y} m/s²</div>
              <div>Z: {sensorData.accelerometer.z} m/s²</div>
            </div>
          </div>
        </div>

        {/* Compass */}
        <div className="glassmorphism rounded-2xl p-6">
          <h3 className="font-serif text-xl mb-4 text-center" style={{fontFamily: 'Georgia, serif'}}>COMPASS</h3>
          <div className="flex flex-col items-center space-y-4">
            <CompassArrow />
            <div className="text-sm text-center font-serif" style={{fontFamily: 'Georgia, serif'}}>
              <div>{sensorData.compass}° from North</div>
            </div>
          </div>
        </div>

        {/* Gyroscope */}
        <div className="glassmorphism rounded-2xl p-6">
          <h3 className="font-serif text-xl mb-4 text-center" style={{fontFamily: 'Georgia, serif'}}>GYROSCOPE</h3>
          <div className="flex flex-col items-center space-y-4">
            <GyroscopeVisualizer />
            <div className="text-xs space-y-1 text-center font-serif" style={{fontFamily: 'Georgia, serif'}}>
              <div>α: {sensorData.gyroscope.alpha}°</div>
              <div>β: {sensorData.gyroscope.beta}°</div>
              <div>γ: {sensorData.gyroscope.gamma}°</div>
            </div>
          </div>
        </div>

        {/* Sound Level */}
        <div className="glassmorphism rounded-2xl p-6">
          <h3 className="font-serif text-xl mb-4 text-center" style={{fontFamily: 'Georgia, serif'}}>SOUND LEVEL</h3>
          <div className="flex flex-col items-center space-y-4">
            <SoundLevelMeter />
            <div className="text-sm text-center font-serif" style={{fontFamily: 'Georgia, serif'}}>{sensorData.soundLevel}%</div>
          </div>
        </div>

        {/* Ambient Light */}
        <div className="glassmorphism rounded-2xl p-6">
          <h3 className="font-serif text-xl mb-4 text-center" style={{fontFamily: 'Georgia, serif'}}>BRIGHTNESS</h3>
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-yellow-200 rounded-full flex items-center justify-center">
              <div
                className="w-12 h-12 bg-yellow-400 rounded-full transition-all duration-300"
                style={{ opacity: Math.min(sensorData.brightness / 1000, 1) }}
              />
            </div>
            <div className="text-sm text-center font-serif" style={{fontFamily: 'Georgia, serif'}}>{sensorData.brightness} lux</div>
          </div>
        </div>

        {/* Battery */}
        <div className="glassmorphism rounded-2xl p-6">
          <h3 className="font-serif text-xl mb-4 text-center" style={{fontFamily: 'Georgia, serif'}}>BATTERY</h3>
          <div className="flex flex-col items-center space-y-4">
            <BatteryIndicator />
            <div className="text-sm text-center font-serif" style={{fontFamily: 'Georgia, serif'}}>
              <div>{sensorData.battery.level}%</div>
              <div>{sensorData.battery.charging ? 'Charging' : 'Not Charging'}</div>
            </div>
          </div>
        </div>

        {/* Temperature */}
        <div className="glassmorphism rounded-2xl p-6">
          <h3 className="font-serif text-xl mb-4 text-center" style={{fontFamily: 'Georgia, serif'}}>TEMPERATURE</h3>
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-24 bg-gray-200 rounded-full relative overflow-hidden">
              <div
                className="absolute bottom-0 w-full bg-gradient-to-t from-blue-400 to-red-400 transition-all duration-300"
                style={{ height: `${Math.min((sensorData.temperature + 20) / 60 * 100, 100)}%` }}
              />
            </div>
            <div className="text-sm text-center font-serif" style={{fontFamily: 'Georgia, serif'}}>{sensorData.temperature}°C</div>
          </div>
        </div>

        {/* Pressure */}
        <div className="glassmorphism rounded-2xl p-6">
          <h3 className="font-serif text-xl mb-4 text-center" style={{fontFamily: 'Georgia, serif'}}>PRESSURE</h3>
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 border-4 border-blue-300 rounded-full flex items-center justify-center">
              <div
                className="bg-blue-400 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(sensorData.pressure / 1100 * 100, 100)}%`,
                  height: `${Math.min(sensorData.pressure / 1100 * 100, 100)}%`
                }}
              />
            </div>
            <div className="text-sm text-center font-serif" style={{fontFamily: 'Georgia, serif'}}>{sensorData.pressure} hPa</div>
          </div>
        </div>

        {/* Proximity */}
        <div className="glassmorphism rounded-2xl p-6">
          <h3 className="font-serif text-xl mb-4 text-center" style={{fontFamily: 'Georgia, serif'}}>PROXIMITY</h3>
          <div className="flex flex-col items-center space-y-4">
            <div className={`w-16 h-16 rounded-full transition-all duration-300 ${
              sensorData.proximity < 5 ? 'bg-red-400' : 'bg-green-400'
            }`} />
            <div className="text-sm text-center font-serif" style={{fontFamily: 'Georgia, serif'}}>{sensorData.proximity} cm</div>
          </div>
        </div>

      </div>

      {/* Permission Status */}
      <div className="mt-8 text-center text-sm text-gray-600 font-serif" style={{fontFamily: 'Georgia, serif'}}>
        <div>Permissions: Motion: {permissions.motion ? '✓' : '✗'} | Audio: {permissions.audio ? '✓' : '✗'} | Camera: {permissions.camera ? '✓' : '✗'}</div>
      </div>
    </div>
  );
}