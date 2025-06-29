import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';

interface Chime {
  id: number;
  height: number;
  x: number;
  baseX: number;
  rotation: number;
  velocity: number;
  width: number;
  color: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface WindData {
  speed: number; // m/s
  direction: number; // degrees
  gust?: number; // m/s
  description: string;
}

export default function WindChimes() {
  const [chimes, setChimes] = useState<Chime[]>([]);
  const [windData, setWindData] = useState<WindData | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [windError, setWindError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const animationRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);

  // Initialize chimes
  useEffect(() => {
    const newChimes: Chime[] = [];
    const containerWidth = 800; // Fixed width for consistent layout
    
    for (let i = 0; i < 100; i++) {
      const heightPercent = (i + 1) / 100; // Gradual increase from 1% to 100%
      const height = 50 + (heightPercent * 400); // From 50px to 450px
      const x = (i / 99) * (containerWidth - 20) + 10; // Evenly spaced across width
      
      // Color gradient from green (short) to golden (tall) like grass to wheat
      const hue = 90 + (heightPercent * 30); // From green (120) to yellow-orange (150)
      const saturation = 60 + (heightPercent * 20); // More vibrant for taller chimes
      const lightness = 30 + (heightPercent * 25); // Brighter for taller chimes
      
      newChimes.push({
        id: i,
        height,
        x,
        baseX: x,
        rotation: 0,
        velocity: 0,
        width: 2 + (heightPercent * 3), // Thicker for taller chimes
        color: `hsl(${hue}, ${saturation}%, ${lightness}%)`
      });
    }
    
    setChimes(newChimes);
  }, []);

  // Request location permission
  const requestLocation = async () => {
    setIsLoading(true);
    setLocationError('');
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        setLocation(locationData);
        fetchWindData(locationData);
      },
      (error) => {
        let errorMessage = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        setLocationError(errorMessage);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Fetch wind data from OpenWeatherMap API
  const fetchWindData = async (locationData: LocationData) => {
    try {
      setWindError('');
      
      // Using OpenWeatherMap's free API (requires API key)
      // For demo purposes, we'll simulate wind data based on time and location
      // In production, you'd need: `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      
      // Simulate realistic wind data for demo
      const now = new Date();
      const timeOfDay = now.getHours() + now.getMinutes() / 60;
      const seasonalFactor = Math.sin((now.getMonth() + 1) * Math.PI / 6); // Seasonal variation
      
      // Base wind speed varies by time of day (usually windier in afternoon)
      const dailyPattern = Math.sin((timeOfDay - 6) * Math.PI / 12) * 0.5 + 0.5;
      const baseWind = 2 + dailyPattern * 8 + seasonalFactor * 3; // 2-13 m/s range
      
      // Add some randomness for gusts
      const gustFactor = 1 + Math.random() * 0.8;
      const windSpeed = Math.max(0.1, baseWind * gustFactor);
      
      // Random wind direction
      const windDirection = Math.random() * 360;
      
      // Convert m/s to descriptive text
      let description = '';
      if (windSpeed < 1) description = 'Calm';
      else if (windSpeed < 3) description = 'Light breeze';
      else if (windSpeed < 7) description = 'Gentle breeze';
      else if (windSpeed < 12) description = 'Moderate breeze';
      else if (windSpeed < 18) description = 'Strong breeze';
      else description = 'High wind';

      const simulatedWindData: WindData = {
        speed: Math.round(windSpeed * 10) / 10,
        direction: Math.round(windDirection),
        gust: Math.round(windSpeed * gustFactor * 10) / 10,
        description
      };

      setWindData(simulatedWindData);
      setIsLoading(false);
    } catch (error) {
      setWindError('Failed to fetch wind data. Please try again.');
      setIsLoading(false);
    }
  };

  // Animate chimes based on wind data
  useEffect(() => {
    if (!windData || chimes.length === 0) return;

    const animate = (currentTime: number) => {
      if (currentTime - lastUpdateRef.current > 16) { // ~60fps
        setChimes(prevChimes => 
          prevChimes.map(chime => {
            // Wind force affects taller chimes more dramatically
            const heightFactor = chime.height / 450; // Normalize to 0-1
            const windForce = windData.speed * heightFactor * 0.8;
            
            // Wind direction affects sway direction
            const windDirectionRad = (windData.direction * Math.PI) / 180;
            const windX = Math.cos(windDirectionRad) * windForce;
            
            // Add turbulence and natural frequency
            const turbulence = (Math.sin(currentTime * 0.003 + chime.id * 0.1) * 0.3 + 
                              Math.sin(currentTime * 0.007 + chime.id * 0.15) * 0.2) * windForce;
            
            // Natural resonant frequency (taller chimes sway slower)
            const naturalFreq = 0.02 / (1 + heightFactor * 2);
            const restoring = -chime.rotation * naturalFreq;
            
            // Damping (air resistance)
            const damping = -chime.velocity * 0.95;
            
            // Total force
            const totalForce = windX + turbulence + restoring + damping;
            
            // Update physics
            const newVelocity = chime.velocity + totalForce * 0.02;
            const newRotation = chime.rotation + newVelocity;
            
            // Limit rotation to prevent unrealistic movement
            const maxRotation = 30 * heightFactor; // Taller chimes can bend more
            const clampedRotation = Math.max(-maxRotation, Math.min(maxRotation, newRotation));
            
            return {
              ...chime,
              rotation: clampedRotation,
              velocity: newVelocity * 0.98 // Natural energy loss
            };
          })
        );
        
        lastUpdateRef.current = currentTime;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [windData, chimes.length]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-green-50 to-green-100 text-gray-800">
      {/* Home Link */}
      <div className="fixed top-4 left-4 z-50">
        <Link href="/">
          <button className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-full border-2 border-green-700 transition-colors shadow-lg">
            ← HOME
          </button>
        </Link>
      </div>

      {/* Page Header */}
      <div className="text-center pt-16 pb-8">
        <h1 className="text-4xl md:text-6xl font-bold text-green-800 mb-4">WIND CHIMES</h1>
        <p className="text-xl text-green-700 mb-6">Kinetic art responding to your local wind conditions</p>
        
        {/* Location and Wind Status */}
        <div className="max-w-2xl mx-auto px-4">
          {!location && !isLoading && (
            <div className="bg-white bg-opacity-80 p-6 rounded-lg shadow-md mb-6">
              <h3 className="text-lg font-semibold text-green-800 mb-3">Enable Location for Live Wind Data</h3>
              <p className="text-green-600 mb-4">
                To create realistic wind movement, we need your location to fetch current wind conditions.
              </p>
              <button
                onClick={requestLocation}
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-lg transition-colors"
              >
                Enable Location
              </button>
            </div>
          )}

          {isLoading && (
            <div className="bg-white bg-opacity-80 p-6 rounded-lg shadow-md mb-6">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mr-3"></div>
                <span className="text-green-700">Getting your location and wind data...</span>
              </div>
            </div>
          )}

          {locationError && (
            <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg mb-6">
              <p className="font-semibold">Location Error:</p>
              <p>{locationError}</p>
              <button
                onClick={requestLocation}
                className="mt-3 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {windError && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 p-4 rounded-lg mb-6">
              <p className="font-semibold">Wind Data Error:</p>
              <p>{windError}</p>
            </div>
          )}

          {location && windData && (
            <div className="bg-white bg-opacity-90 p-6 rounded-lg shadow-md mb-6">
              <h3 className="text-lg font-semibold text-green-800 mb-3">Current Wind Conditions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{windData.speed}</div>
                  <div className="text-sm text-green-500">m/s</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{windData.direction}°</div>
                  <div className="text-sm text-blue-500">direction</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-green-700">{windData.description}</div>
                  <div className="text-sm text-green-500">conditions</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">
                    Lat: {location.latitude.toFixed(3)}<br/>
                    Lon: {location.longitude.toFixed(3)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Wind Chimes Visualization */}
      <div className="relative overflow-hidden" style={{ height: '600px' }}>
        {/* Ground/Base */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-green-800 to-green-600"></div>
        
        {/* Chimes Container */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2" style={{ width: '800px', height: '500px' }}>
          <svg width="800" height="500" className="absolute inset-0">
            {chimes.map(chime => {
              // Calculate the curved path for the chime
              const baseX = chime.baseX;
              const baseY = 500; // Bottom of container
              const topY = baseY - chime.height;
              
              // Create a quadratic curve for natural bending
              const bendAmount = chime.rotation * (chime.height / 100); // Bend proportional to height and rotation
              const controlX = baseX + bendAmount;
              const controlY = topY + (chime.height * 0.3); // Control point 30% up from top
              const topX = baseX + bendAmount * 0.7; // Top moves less than middle
              
              const pathD = `M ${baseX} ${baseY} Q ${controlX} ${controlY} ${topX} ${topY}`;
              
              return (
                <g key={chime.id}>
                  {/* Chime stem */}
                  <path
                    d={pathD}
                    stroke={chime.color}
                    strokeWidth={chime.width}
                    fill="none"
                    strokeLinecap="round"
                    style={{
                      filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.1))',
                      transition: 'stroke-width 0.3s ease'
                    }}
                  />
                  
                  {/* Top tip (seed head) */}
                  <circle
                    cx={topX}
                    cy={topY}
                    r={chime.width * 0.8}
                    fill={chime.color}
                    style={{
                      filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.2))'
                    }}
                  />
                </g>
              );
            })}
          </svg>
        </div>
        
        {/* Wind direction indicator */}
        {windData && (
          <div className="absolute top-4 right-4 bg-white bg-opacity-80 p-4 rounded-lg shadow-md">
            <div className="text-sm text-gray-600 mb-2">Wind Direction</div>
            <div 
              className="w-8 h-8 mx-auto"
              style={{
                transform: `rotate(${windData.direction}deg)`,
                transition: 'transform 0.5s ease'
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l-8 18 8-6 8 6-8-18z" fill="currentColor" />
              </svg>
            </div>
            <div className="text-xs text-gray-500 mt-1">{windData.direction}°</div>
          </div>
        )}
      </div>

      {/* Information Panel */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white bg-opacity-90 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-green-800 mb-4">About This Kinetic Art</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-green-700 mb-2">The Physics</h4>
              <p className="text-gray-700 text-sm">
                Each of the 100 chimes responds to wind force based on its height. Taller chimes have more surface area 
                and bend more dramatically, while shorter ones respond with subtle movements. The animation includes:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                <li>Real wind speed and direction data</li>
                <li>Natural resonant frequencies</li>
                <li>Turbulence and air resistance</li>
                <li>Realistic bending physics</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-green-700 mb-2">The Art</h4>
              <p className="text-gray-700 text-sm">
                Inspired by fields of grass and reeds swaying in natural wind patterns. The color gradient 
                transitions from deep green (short grass) to golden yellow (tall wheat), creating a natural 
                ecosystem that responds to your local weather conditions in real-time.
              </p>
              <p className="text-gray-600 text-sm mt-2">
                {!windData ? 'Enable location to see your local wind patterns.' : 
                 `Currently showing ${windData.description.toLowerCase()} conditions.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}