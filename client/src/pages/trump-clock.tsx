import { Link } from 'wouter';
import { useState, useEffect } from 'react';
import trumpImage from '@assets/image_1751088966989.png';
import vanceImage from '@assets/image_1751089063177.png';
import tacoImage from '@assets/image_1751089460552.png';
import golfBallImage from '@assets/image_1751090576666.png';

export default function TrumpClock() {
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
  };

  const getTimeZone = () => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white relative overflow-hidden">
      
      {/* Background paint swirling effect */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(251, 191, 36, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(236, 72, 153, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 70% 20%, rgba(16, 185, 129, 0.3) 0%, transparent 50%)
          `
        }}
      />
      
      {/* Header */}
      <div className="text-center pt-16 pb-8 relative z-10">
        <Link href="/" className="no-underline">
          <h1 className="font-xanman-wide text-6xl md:text-8xl text-white mb-4 cursor-pointer hover:text-orange-400 transition-colors duration-300">
            XANDER WALKER
          </h1>
        </Link>
        <div className="text-center">
          <h2 className="font-xanman text-2xl md:text-3xl text-orange-400 mb-2">POLITICAL TIME</h2>
          <div className="text-lg font-mono">{formatTime(time)}</div>
          <div className="text-sm opacity-75 mt-1">{getTimeZone()}</div>
        </div>
      </div>

      {/* Trump Political Clock - centered */}
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          
          {/* Political Clock Face */}
          <svg
            width="400"
            height="400"
            viewBox="0 0 300 300"
            className="drop-shadow-2xl"
          >
            <defs>
              {/* Golf ball pattern */}
              <pattern id="golfBallPattern" x="0" y="0" width="15" height="15" patternUnits="userSpaceOnUse">
                <circle cx="7.5" cy="7.5" r="3" fill="rgba(0,0,0,0.1)" />
              </pattern>
              <clipPath id="clockFace">
                <circle cx="150" cy="150" r="130" />
              </clipPath>
            </defs>
            
            {/* Golf ball clock face - using actual image, no background */}
            <image
              href={golfBallImage}
              x="20"
              y="20"
              width="260"
              height="260"
              preserveAspectRatio="xMidYMid slice"
              clipPath="url(#clockFace)"
            />

            {/* Trump image as hour hand - shorter radius to avoid overlap */}
            <g
              style={{ 
                transformOrigin: '150px 150px',
                transform: `rotate(${hourAngle}deg)`,
              }}
            >
              <image
                href={trumpImage}
                x="130"
                y="105"
                width="40"
                height="50"
                style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))' }}
              />
            </g>

            {/* Vance image as minute hand - further out to prevent overlap */}
            <g
              style={{ 
                transformOrigin: '150px 150px',
                transform: `rotate(${minuteAngle}deg)`,
              }}
            >
              <image
                href={vanceImage}
                x="135"
                y="60"
                width="30"
                height="40"
                style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))' }}
              />
            </g>

            {/* Taco image as second hand - all the way to edge */}
            <g
              style={{ 
                transformOrigin: '150px 150px',
                transform: `rotate(${secondAngle}deg)`,
              }}
            >
              <image
                href={tacoImage}
                x="142"
                y="25"
                width="16"
                height="20"
                style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))' }}
              />
            </g>

            {/* Center point */}
            <circle
              cx="150"
              cy="150"
              r="5"
              fill="rgba(255, 255, 255, 0.9)"
              stroke="#374151"
              strokeWidth="2"
            />
          </svg>

        </div>
      </div>

      {/* Back to Projects Button */}
      <div className="text-center pb-16">
        <Link href="/projects" className="no-underline">
          <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300">
            BACK TO PROJECTS
          </button>
        </Link>
      </div>
    </div>
  );
}