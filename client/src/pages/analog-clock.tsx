import { Link } from 'wouter';
import { useState, useEffect } from 'react';

export default function AnalogClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calculate angles for clock hands (0 degrees = 12 o'clock position)
  const secondAngle = (time.getSeconds() * 6); // 6 degrees per second
  const minuteAngle = (time.getMinutes() * 6 + time.getSeconds() * 0.1); // 6 degrees per minute + smooth seconds
  const hourAngle = ((time.getHours() % 12) * 30 + time.getMinutes() * 0.5); // 30 degrees per hour + smooth minutes
  
  // Debug logging
  console.log('Current time:', time.toLocaleTimeString());
  console.log('Hours:', time.getHours(), 'Minutes:', time.getMinutes(), 'Seconds:', time.getSeconds());
  console.log('Hour angle:', hourAngle, 'Minute angle:', minuteAngle, 'Second angle:', secondAngle);

  // Generate hour markers (starting at 12 o'clock and going clockwise)
  const hourMarkers = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30) * (Math.PI / 180);
    const outerX = 200 + Math.sin(angle) * 170;
    const outerY = 200 - Math.cos(angle) * 170;
    const innerX = 200 + Math.sin(angle) * 150;
    const innerY = 200 - Math.cos(angle) * 150;
    const number = i === 0 ? 12 : i;
    const textX = 200 + Math.sin(angle) * 135;
    const textY = 200 - Math.cos(angle) * 135;
    
    return {
      id: i,
      line: { x1: outerX, y1: outerY, x2: innerX, y2: innerY },
      number,
      textX,
      textY
    };
  });

  // Generate minute markers
  const minuteMarkers = Array.from({ length: 60 }, (_, i) => {
    if (i % 5 === 0) return null; // Skip hour positions
    const angle = (i * 6) * (Math.PI / 180);
    const outerX = 200 + Math.sin(angle) * 170;
    const outerY = 200 - Math.cos(angle) * 170;
    const innerX = 200 + Math.sin(angle) * 160;
    const innerY = 200 - Math.cos(angle) * 160;
    
    return {
      id: i,
      line: { x1: outerX, y1: outerY, x2: innerX, y2: innerY }
    };
  }).filter((marker): marker is NonNullable<typeof marker> => marker !== null);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getTimeZone = () => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      
      {/* Title */}
      <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-20">
        <Link href="/">
          <h1 className="font-xanman-wide text-3xl md:text-4xl text-white glassmorphism px-8 py-4 rounded-lg hover:bg-white/20 transition-all duration-300 cursor-pointer">
            XANDER WALKER
          </h1>
        </Link>
      </div>

      {/* Navigation */}
      <div className="fixed top-8 left-8 z-20">
        <Link href="/projects">
          <button className="glassmorphism px-6 py-3 rounded-lg text-white font-xanman-wide hover:bg-white/20 transition-all duration-300">
            PROJECTS
          </button>
        </Link>
      </div>

      {/* Digital Time Display */}
      <div className="fixed top-8 right-8 z-20">
        <div className="glassmorphism px-6 py-3 rounded-lg text-white font-xanman-wide text-lg text-center">
          <div>{formatTime(time)}</div>
          <div className="text-sm opacity-75 mt-1">{getTimeZone()}</div>
        </div>
      </div>

      {/* Main Clock */}
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative">
          
          {/* Clock Face */}
          <svg
            width="400"
            height="400"
            viewBox="0 0 400 400"
            className="drop-shadow-2xl"
          >
            {/* Outer ring */}
            <circle
              cx="200"
              cy="200"
              r="190"
              fill="rgba(255, 255, 255, 0.1)"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="4"
            />
            
            {/* Inner ring */}
            <circle
              cx="200"
              cy="200"
              r="175"
              fill="rgba(255, 255, 255, 0.05)"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="2"
            />

            {/* Hour markers */}
            {hourMarkers.map(marker => (
              <g key={marker.id}>
                <line
                  x1={marker.line.x1}
                  y1={marker.line.y1}
                  x2={marker.line.x2}
                  y2={marker.line.y2}
                  stroke="rgba(255, 255, 255, 0.8)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <text
                  x={marker.textX}
                  y={marker.textY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="rgba(255, 255, 255, 0.9)"
                  fontSize="24"
                  fontWeight="bold"
                  fontFamily="Georgia, serif"
                >
                  {marker.number}
                </text>
              </g>
            ))}

            {/* Minute markers */}
            {minuteMarkers.map(marker => (
              <line
                key={marker.id}
                x1={marker.line.x1}
                y1={marker.line.y1}
                x2={marker.line.x2}
                y2={marker.line.y2}
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth="1"
                strokeLinecap="round"
              />
            ))}

            {/* Hour hand */}
            <line
              x1="200"
              y1="200"
              x2={200 + Math.sin(hourAngle * Math.PI / 180) * 80}
              y2={200 - Math.cos(hourAngle * Math.PI / 180) * 80}
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="8"
              strokeLinecap="round"
              style={{
                filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))'
              }}
            />

            {/* Minute hand */}
            <line
              x1="200"
              y1="200"
              x2={200 + Math.sin(minuteAngle * Math.PI / 180) * 120}
              y2={200 - Math.cos(minuteAngle * Math.PI / 180) * 120}
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="6"
              strokeLinecap="round"
              style={{
                filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))'
              }}
            />

            {/* Second hand */}
            <line
              x1="200"
              y1="200"
              x2={200 + Math.sin(secondAngle * Math.PI / 180) * 140}
              y2={200 - Math.cos(secondAngle * Math.PI / 180) * 140}
              stroke="#ff6b35"
              strokeWidth="2"
              strokeLinecap="round"
              style={{
                filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))'
              }}
            />

            {/* Center dot */}
            <circle
              cx="200"
              cy="200"
              r="12"
              fill="rgba(255, 255, 255, 0.9)"
              stroke="#ff6b35"
              strokeWidth="2"
              style={{
                filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))'
              }}
            />

            {/* Second hand center dot */}
            <circle
              cx="200"
              cy="200"
              r="6"
              fill="#ff6b35"
            />
          </svg>

          {/* Clock Title */}
          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
            <h2 className="font-xanman-wide text-2xl text-white text-center">
              ANALOG CLOCK
            </h2>
          </div>

        </div>
      </div>

      {/* Ambient Animation */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>
    </div>
  );
}