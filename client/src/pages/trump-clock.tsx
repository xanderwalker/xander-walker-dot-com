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



  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      {/* Temporary debug info - will remove after fixing */}
      <div className="absolute top-4 left-4 text-white text-sm">
        Debug: {time.toLocaleTimeString()}
        <br />
        Hours: {time.getHours()} Minutes: {time.getMinutes()} Seconds: {time.getSeconds()}
        <br />
        Hour Angle: {hourAngle.toFixed(1)}°
      </div>
      {/* Trump Political Clock - centered, no other elements */}
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

        {/* Trump image as hour hand - moved further out from center */}
        <g
          style={{ 
            transformOrigin: '150px 150px',
            transform: `rotate(${hourAngle}deg)`,
          }}
        >
          <image
            href={trumpImage}
            x="127"
            y="92.25"
            width="46"
            height="57.5"
            style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))' }}
          />
        </g>

        {/* Vance image as minute hand - moved further out from center */}
        <g
          style={{ 
            transformOrigin: '150px 150px',
            transform: `rotate(${minuteAngle}deg)`,
          }}
        >
          <image
            href={vanceImage}
            x="132.75"
            y="47"
            width="34.5"
            height="46"
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
            x="139.66"
            y="21.375"
            width="21.16"
            height="26.45"
            style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))' }}
          />
        </g>
      </svg>
    </div>
  );
}