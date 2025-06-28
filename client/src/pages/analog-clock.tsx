import { Link } from 'wouter';
import { useState, useEffect } from 'react';
import trumpImage from '@assets/image_1751088966989.png';
import vanceImage from '@assets/image_1751089063177.png';
import tacoImage from '@assets/image_1751089460552.png';
import golfBallImage from '@assets/image_1751090296521.png';

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

      {/* Political Clock */}
      <div className="flex items-center justify-center pt-32 pb-16">
        <div className="relative">
          
          {/* Political Clock Face */}
          <svg
            width="300"
            height="300"
            viewBox="0 0 300 300"
            className="drop-shadow-2xl"
          >
            <defs>
              {/* Golf ball pattern */}
              <pattern id="golfBallPattern" x="0" y="0" width="15" height="15" patternUnits="userSpaceOnUse">
                <circle cx="7.5" cy="7.5" r="3" fill="rgba(0,0,0,0.1)" />
              </pattern>
            </defs>
            
            {/* Golf ball clock face - using actual image, properly centered */}
            <circle cx="150" cy="150" r="130" fill="white" />
            <image
              href={golfBallImage}
              x="20"
              y="20"
              width="260"
              height="260"
              preserveAspectRatio="xMidYMid slice"
              style={{ clipPath: 'circle(130px at 150px 150px)' }}
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

          {/* Political Clock Title */}
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
            <h3 className="font-xanman-wide text-lg text-white text-center">
              POLITICAL TIME
            </h3>
          </div>

        </div>
      </div>

      {/* Radar Screen Clock */}
      <div className="flex items-center justify-center pb-16">
        <div className="relative">
          
          {/* Radar Clock Face */}
          <svg
            width="320"
            height="320"
            viewBox="0 0 320 320"
            className="drop-shadow-2xl"
          >
            <defs>
              {/* Radar screen gradient */}
              <radialGradient id="radarGradient" cx="0.5" cy="0.5" r="0.8">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="70%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#334155" />
              </radialGradient>
              
              {/* Radar sweep gradient */}
              <linearGradient id="sweepGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0" />
                <stop offset="30%" stopColor="#22c55e" stopOpacity="0.3" />
                <stop offset="70%" stopColor="#22c55e" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.9" />
              </linearGradient>
              
              {/* Glow filter */}
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Radar screen background */}
            <circle
              cx="160"
              cy="160"
              r="140"
              fill="url(#radarGradient)"
              stroke="#22c55e"
              strokeWidth="2"
            />
            
            {/* Radar grid circles */}
            <circle cx="160" cy="160" r="35" fill="none" stroke="#22c55e" strokeWidth="0.5" opacity="0.4" />
            <circle cx="160" cy="160" r="70" fill="none" stroke="#22c55e" strokeWidth="0.5" opacity="0.4" />
            <circle cx="160" cy="160" r="105" fill="none" stroke="#22c55e" strokeWidth="0.5" opacity="0.4" />
            
            {/* Radar grid lines */}
            <line x1="160" y1="20" x2="160" y2="300" stroke="#22c55e" strokeWidth="0.5" opacity="0.4" />
            <line x1="20" y1="160" x2="300" y2="160" stroke="#22c55e" strokeWidth="0.5" opacity="0.4" />
            <line x1="60" y1="60" x2="260" y2="260" stroke="#22c55e" strokeWidth="0.5" opacity="0.3" />
            <line x1="260" y1="60" x2="60" y2="260" stroke="#22c55e" strokeWidth="0.5" opacity="0.3" />

            {/* Radar sweep beam - full rotation every second */}
            <g transform={`rotate(${(time.getSeconds() * 6)} 160 160)`}>
              <path
                d="M 160 160 L 160 20 A 140 140 0 0 1 195 35 Z"
                fill="url(#sweepGradient)"
                opacity="0.6"
              />
              <line
                x1="160"
                y1="160"
                x2="160"
                y2="20"
                stroke="#22c55e"
                strokeWidth="2"
                filter="url(#glow)"
              />
            </g>

            {/* Battleship (hour hand) */}
            <g
              transform={`translate(${160 + Math.sin(hourAngle * Math.PI / 180) * 60}, ${160 - Math.cos(hourAngle * Math.PI / 180) * 60}) rotate(${hourAngle})`}
            >
              {/* Ship hull */}
              <rect x="-8" y="-3" width="16" height="6" fill="#ef4444" rx="1" />
              {/* Ship superstructure */}
              <rect x="-4" y="-2" width="8" height="3" fill="#dc2626" />
              {/* Ship bow */}
              <polygon points="8,0 12,0 8,-1 8,1" fill="#ef4444" />
              {/* Radar blip glow */}
              <circle cx="0" cy="0" r="6" fill="#ef4444" opacity="0.3" filter="url(#glow)" />
            </g>

            {/* Smaller ship (minute hand) */}
            <g
              transform={`translate(${160 + Math.sin(minuteAngle * Math.PI / 180) * 90}, ${160 - Math.cos(minuteAngle * Math.PI / 180) * 90}) rotate(${minuteAngle})`}
            >
              {/* Ship hull */}
              <rect x="-5" y="-2" width="10" height="4" fill="#3b82f6" rx="1" />
              {/* Ship superstructure */}
              <rect x="-2" y="-1" width="4" height="2" fill="#1d4ed8" />
              {/* Ship bow */}
              <polygon points="5,0 8,0 5,-1 5,1" fill="#3b82f6" />
              {/* Radar blip glow */}
              <circle cx="0" cy="0" r="4" fill="#3b82f6" opacity="0.3" filter="url(#glow)" />
            </g>

            {/* Aircraft (second hand) */}
            <g
              transform={`translate(${160 + Math.sin(secondAngle * Math.PI / 180) * 120}, ${160 - Math.cos(secondAngle * Math.PI / 180) * 120}) rotate(${secondAngle})`}
            >
              {/* Aircraft body */}
              <rect x="-1" y="-4" width="2" height="8" fill="#fbbf24" />
              {/* Wings */}
              <rect x="-6" y="-1" width="12" height="2" fill="#f59e0b" />
              {/* Tail */}
              <polygon points="-1,-4 1,-4 0,-6" fill="#fbbf24" />
              {/* Radar blip glow */}
              <circle cx="0" cy="0" r="3" fill="#fbbf24" opacity="0.3" filter="url(#glow)" />
            </g>

            {/* Center radar hub */}
            <circle
              cx="160"
              cy="160"
              r="5"
              fill="#22c55e"
              stroke="#16a34a"
              strokeWidth="1"
              filter="url(#glow)"
            />
            
            {/* Radar screen rim */}
            <circle
              cx="160"
              cy="160"
              r="140"
              fill="none"
              stroke="#22c55e"
              strokeWidth="3"
              filter="url(#glow)"
            />
          </svg>

          {/* Radar Clock Title */}
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
            <h3 className="font-xanman-wide text-lg text-white text-center">
              RADAR TIME
            </h3>
          </div>

        </div>
      </div>

      {/* Square Geometric Clock */}
      <div className="flex items-center justify-center pb-16">
        <div className="relative">
          
          {/* Square Clock Face */}
          <svg
            width="280"
            height="280"
            viewBox="0 0 280 280"
            className="drop-shadow-2xl"
          >
            <defs>
              {/* Yellow square gradient */}
              <linearGradient id="squareGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="50%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#eab308" />
              </linearGradient>
            </defs>
            
            {/* Yellow square face */}
            <rect
              x="40"
              y="40"
              width="200"
              height="200"
              fill="url(#squareGradient)"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="3"
              rx="15"
            />
            
            {/* Inner square border */}
            <rect
              x="50"
              y="50"
              width="180"
              height="180"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1"
              rx="10"
            />

            {/* Red triangle for hour hand */}
            <polygon
              points={`140,140 ${140 + Math.sin(hourAngle * Math.PI / 180) * 50},${140 - Math.cos(hourAngle * Math.PI / 180) * 50} ${140 + Math.sin((hourAngle + 15) * Math.PI / 180) * 35},${140 - Math.cos((hourAngle + 15) * Math.PI / 180) * 35}`}
              fill="#dc2626"
              stroke="#991b1b"
              strokeWidth="1"
            />

            {/* Blue circle for minute hand */}
            <circle
              cx={140 + Math.sin(minuteAngle * Math.PI / 180) * 70}
              cy={140 - Math.cos(minuteAngle * Math.PI / 180) * 70}
              r="8"
              fill="#3b82f6"
              stroke="#1d4ed8"
              strokeWidth="2"
            />

            {/* Purple heart for second hand */}
            <g
              transform={`translate(${140 + Math.sin(secondAngle * Math.PI / 180) * 85}, ${140 - Math.cos(secondAngle * Math.PI / 180) * 85})`}
            >
              <path
                d="M0,-3 C-3,-8 -8,-8 -8,-3 C-8,0 -5,3 0,8 C5,3 8,0 8,-3 C8,-8 3,-8 0,-3 Z"
                fill="#8b5cf6"
                stroke="#7c3aed"
                strokeWidth="1"
              />
            </g>

            {/* Center square */}
            <rect
              x="135"
              y="135"
              width="10"
              height="10"
              fill="rgba(255, 255, 255, 0.9)"
              stroke="#374151"
              strokeWidth="1"
              rx="2"
            />
          </svg>

          {/* Square Clock Title */}
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
            <h3 className="font-xanman-wide text-lg text-white text-center">
              GEOMETRIC TIME
            </h3>
          </div>

        </div>
      </div>

      {/* Dry Amoeba Clock */}
      <div className="flex items-center justify-center pb-16">
        <div className="relative">
          
          {/* Dry Amoeba Clock Face */}
          <svg
            width="320"
            height="320"
            viewBox="0 0 320 320"
            className="drop-shadow-2xl"
          >
            <defs>
              {/* Dry amoeba gradient that shifts colors */}
              <radialGradient id="dryAmoebaGradient" cx="0.5" cy="0.5" r="0.8">
                <stop offset="0%" stopColor="#fbbf24">
                  <animate attributeName="stop-color" 
                    values="#fbbf24;#ec4899;#3b82f6;#10b981;#fbbf24" 
                    dur="8s" repeatCount="indefinite" />
                </stop>
                <stop offset="50%" stopColor="#ec4899">
                  <animate attributeName="stop-color" 
                    values="#ec4899;#3b82f6;#10b981;#fbbf24;#ec4899" 
                    dur="8s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#3b82f6">
                  <animate attributeName="stop-color" 
                    values="#3b82f6;#10b981;#fbbf24;#ec4899;#3b82f6" 
                    dur="8s" repeatCount="indefinite" />
                </stop>
              </radialGradient>
              
              {/* Dry hour hand gradient */}
              <radialGradient id="dryHourHandGradient" cx="0.5" cy="0.5" r="0.8">
                <stop offset="0%" stopColor="#f97316">
                  <animate attributeName="stop-color" 
                    values="#f97316;#8b5cf6;#06b6d4;#f59e0b;#f97316" 
                    dur="6s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#dc2626" stopOpacity="0.7">
                  <animate attributeName="stop-color" 
                    values="#dc2626;#7c3aed;#0891b2;#d97706;#dc2626" 
                    dur="6s" repeatCount="indefinite" />
                </stop>
              </radialGradient>
              
              {/* Dry minute hand gradient */}
              <radialGradient id="dryMinuteHandGradient" cx="0.5" cy="0.5" r="0.8">
                <stop offset="0%" stopColor="#22c55e">
                  <animate attributeName="stop-color" 
                    values="#22c55e;#f59e0b;#ef4444;#8b5cf6;#22c55e" 
                    dur="5s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#059669" stopOpacity="0.7">
                  <animate attributeName="stop-color" 
                    values="#059669;#d97706;#dc2626;#7c3aed;#059669" 
                    dur="5s" repeatCount="indefinite" />
                </stop>
              </radialGradient>
              
              {/* Blur filter for soft edges */}
              <filter id="drySoften" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2"/>
              </filter>
            </defs>
            
            {/* Morphing dry amoeba shape */}
            <path
              fill="url(#dryAmoebaGradient)"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="2"
              filter="url(#drySoften)"
            >
              <animate attributeName="d" 
                values="M160,60 C220,80 260,120 270,160 C280,200 250,240 200,250 C150,260 100,240 80,200 C60,160 80,120 120,80 C140,70 150,65 160,60 Z;
                        M160,50 C230,70 280,110 290,160 C300,210 260,250 210,260 C160,270 110,250 90,210 C70,170 90,130 130,90 C150,75 155,60 160,50 Z;
                        M160,70 C210,90 250,130 260,160 C270,190 240,230 190,240 C140,250 90,230 70,190 C50,150 70,110 110,70 C130,60 145,65 160,70 Z;
                        M160,60 C220,80 260,120 270,160 C280,200 250,240 200,250 C150,260 100,240 80,200 C60,160 80,120 120,80 C140,70 150,65 160,60 Z"
                dur="12s" repeatCount="indefinite" />
            </path>

            {/* Hour hand - large soft circle */}
            <circle
              cx={160 + Math.sin(hourAngle * Math.PI / 180) * 50}
              cy={160 - Math.cos(hourAngle * Math.PI / 180) * 50}
              r="18"
              fill="url(#dryHourHandGradient)"
              filter="url(#drySoften)"
              opacity="0.9"
            />

            {/* Minute hand - smaller soft circle */}
            <circle
              cx={160 + Math.sin(minuteAngle * Math.PI / 180) * 80}
              cy={160 - Math.cos(minuteAngle * Math.PI / 180) * 80}
              r="12"
              fill="url(#dryMinuteHandGradient)"
              filter="url(#drySoften)"
              opacity="0.9"
            />

            {/* Center point */}
            <circle
              cx="160"
              cy="160"
              r="4"
              fill="rgba(255, 255, 255, 0.8)"
              filter="url(#drySoften)"
            />
          </svg>

          {/* Dry Amoeba Clock Title */}
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
            <h3 className="font-xanman-wide text-lg text-white text-center">
              DRY FLUID TIME
            </h3>
          </div>

        </div>
      </div>

      {/* Amoeba Clock */}
      <div className="flex items-center justify-center pb-16">
        <div className="relative">
          
          {/* Amoeba Clock Face */}
          <svg
            width="320"
            height="320"
            viewBox="0 0 320 320"
            className="drop-shadow-2xl"
          >
            <defs>
              {/* Amoeba gradient that shifts colors */}
              <radialGradient id="amoebaGradient" cx="0.5" cy="0.5" r="0.8">
                <stop offset="0%" stopColor="#fbbf24">
                  <animate attributeName="stop-color" 
                    values="#fbbf24;#ec4899;#3b82f6;#10b981;#fbbf24" 
                    dur="8s" repeatCount="indefinite" />
                </stop>
                <stop offset="50%" stopColor="#ec4899">
                  <animate attributeName="stop-color" 
                    values="#ec4899;#3b82f6;#10b981;#fbbf24;#ec4899" 
                    dur="8s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#3b82f6">
                  <animate attributeName="stop-color" 
                    values="#3b82f6;#10b981;#fbbf24;#ec4899;#3b82f6" 
                    dur="8s" repeatCount="indefinite" />
                </stop>
              </radialGradient>
              
              {/* Water gradient */}
              <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#1d4ed8" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#1e3a8a" stopOpacity="1" />
              </linearGradient>
              
              {/* Hour hand gradient */}
              <radialGradient id="hourHandGradient" cx="0.5" cy="0.5" r="0.8">
                <stop offset="0%" stopColor="#f97316">
                  <animate attributeName="stop-color" 
                    values="#f97316;#8b5cf6;#06b6d4;#f59e0b;#f97316" 
                    dur="6s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#dc2626" stopOpacity="0.7">
                  <animate attributeName="stop-color" 
                    values="#dc2626;#7c3aed;#0891b2;#d97706;#dc2626" 
                    dur="6s" repeatCount="indefinite" />
                </stop>
              </radialGradient>
              
              {/* Minute hand gradient */}
              <radialGradient id="minuteHandGradient" cx="0.5" cy="0.5" r="0.8">
                <stop offset="0%" stopColor="#22c55e">
                  <animate attributeName="stop-color" 
                    values="#22c55e;#f59e0b;#ef4444;#8b5cf6;#22c55e" 
                    dur="5s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#059669" stopOpacity="0.7">
                  <animate attributeName="stop-color" 
                    values="#059669;#d97706;#dc2626;#7c3aed;#059669" 
                    dur="5s" repeatCount="indefinite" />
                </stop>
              </radialGradient>
              
              {/* Blur filter for soft edges */}
              <filter id="soften" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2"/>
              </filter>
            </defs>
            
            {/* Morphing amoeba shape */}
            <path
              fill="url(#amoebaGradient)"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="2"
              filter="url(#soften)"
            >
              <animate attributeName="d" 
                values="M160,60 C220,80 260,120 270,160 C280,200 250,240 200,250 C150,260 100,240 80,200 C60,160 80,120 120,80 C140,70 150,65 160,60 Z;
                        M160,50 C230,70 280,110 290,160 C300,210 260,250 210,260 C160,270 110,250 90,210 C70,170 90,130 130,90 C150,75 155,60 160,50 Z;
                        M160,70 C210,90 250,130 260,160 C270,190 240,230 190,240 C140,250 90,230 70,190 C50,150 70,110 110,70 C130,60 145,65 160,70 Z;
                        M160,60 C220,80 260,120 270,160 C280,200 250,240 200,250 C150,260 100,240 80,200 C60,160 80,120 120,80 C140,70 150,65 160,60 Z"
                dur="12s" repeatCount="indefinite" />
            </path>
            
            {/* Water inside amoeba - sloshing animation */}
            <clipPath id="amoebaClip">
              <path>
                <animate attributeName="d" 
                  values="M160,60 C220,80 260,120 270,160 C280,200 250,240 200,250 C150,260 100,240 80,200 C60,160 80,120 120,80 C140,70 150,65 160,60 Z;
                          M160,50 C230,70 280,110 290,160 C300,210 260,250 210,260 C160,270 110,250 90,210 C70,170 90,130 130,90 C150,75 155,60 160,50 Z;
                          M160,70 C210,90 250,130 260,160 C270,190 240,230 190,240 C140,250 90,230 70,190 C50,150 70,110 110,70 C130,60 145,65 160,70 Z;
                          M160,60 C220,80 260,120 270,160 C280,200 250,240 200,250 C150,260 100,240 80,200 C60,160 80,120 120,80 C140,70 150,65 160,60 Z"
                  dur="12s" repeatCount="indefinite" />
              </path>
            </clipPath>
            
            {/* Water surface with gentle sloshing */}
            <path
              clipPath="url(#amoebaClip)"
              fill="url(#waterGradient)"
              opacity="0.8"
            >
              <animate attributeName="d" 
                values="M50,200 Q100,195 150,200 T250,205 Q270,210 290,205 L290,300 L50,300 Z;
                        M50,205 Q100,200 150,195 T250,200 Q270,205 290,210 L290,300 L50,300 Z;
                        M50,195 Q100,190 150,200 T250,195 Q270,200 290,195 L290,300 L50,300 Z;
                        M50,200 Q100,195 150,200 T250,205 Q270,210 290,205 L290,300 L50,300 Z"
                dur="4s" repeatCount="indefinite" />
            </path>
            
            {/* Water surface highlights */}
            <path
              clipPath="url(#amoebaClip)"
              fill="rgba(255,255,255,0.2)"
              opacity="0.6"
            >
              <animate attributeName="d" 
                values="M50,200 Q120,198 180,202 T290,205 L290,210 Q220,207 160,205 T50,208 Z;
                        M50,205 Q120,203 180,207 T290,210 L290,215 Q220,212 160,210 T50,213 Z;
                        M50,195 Q120,193 180,197 T290,200 L290,205 Q220,202 160,200 T50,203 Z;
                        M50,200 Q120,198 180,202 T290,205 L290,210 Q220,207 160,205 T50,208 Z"
                dur="4s" repeatCount="indefinite" />
            </path>

            {/* Hour hand - large soft circle */}
            <circle
              cx={160 + Math.sin(hourAngle * Math.PI / 180) * 50}
              cy={160 - Math.cos(hourAngle * Math.PI / 180) * 50}
              r="18"
              fill="url(#hourHandGradient)"
              filter="url(#soften)"
              opacity="0.9"
            />

            {/* Minute hand - smaller soft circle */}
            <circle
              cx={160 + Math.sin(minuteAngle * Math.PI / 180) * 80}
              cy={160 - Math.cos(minuteAngle * Math.PI / 180) * 80}
              r="12"
              fill="url(#minuteHandGradient)"
              filter="url(#soften)"
              opacity="0.9"
            />

            {/* Center point */}
            <circle
              cx="160"
              cy="160"
              r="4"
              fill="rgba(255, 255, 255, 0.8)"
              filter="url(#soften)"
            />
          </svg>

          {/* Amoeba Clock Title */}
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
            <h3 className="font-xanman-wide text-lg text-white text-center">
              FLUID TIME
            </h3>
          </div>

        </div>
      </div>

      {/* New York Clock */}
      <div className="flex items-center justify-center pb-16">
        <div className="relative">
          
          {/* NY Clock Face */}
          <svg
            width="300"
            height="300"
            viewBox="0 0 300 300"
            className="drop-shadow-2xl"
          >
            {/* Red Apple Clock Face */}
            <defs>
              <radialGradient id="appleGradient" cx="0.3" cy="0.3" r="0.8">
                <stop offset="0%" stopColor="#ff6b6b" />
                <stop offset="50%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#991b1b" />
              </radialGradient>
            </defs>
            
            {/* Apple body */}
            <path
              d="M 150 50 
                 C 200 50, 230 80, 230 130
                 C 230 180, 220 220, 200 240
                 C 180 260, 170 270, 150 270
                 C 130 270, 120 260, 100 240
                 C 80 220, 70 180, 70 130
                 C 70 80, 100 50, 150 50 Z"
              fill="url(#appleGradient)"
              stroke="#7f1d1d"
              strokeWidth="2"
            />
            
            {/* Apple stem */}
            <rect x="147" y="45" width="6" height="15" fill="#166534" rx="3" />
            
            {/* Apple leaf */}
            <ellipse cx="160" cy="50" rx="8" ry="4" fill="#16a34a" transform="rotate(30 160 50)" />

            {/* Statue of Liberty Hour Hand */}
            <g 
              style={{ 
                transformOrigin: '150px 150px',
                transform: `rotate(${hourAngle}deg)`,
              }}
            >
              {/* Base and pedestal */}
              <rect x="148" y="140" width="4" height="10" fill="#a8a29e" />
              
              {/* Statue body */}
              <rect x="147" y="120" width="6" height="20" fill="#84cc16" rx="3" />
              
              {/* Head */}
              <circle cx="150" cy="115" r="4" fill="#fbbf24" />
              
              {/* Crown spikes */}
              <polygon points="146,111 148,106 150,111" fill="#fbbf24" />
              <polygon points="148,110 150,105 152,110" fill="#fbbf24" />
              <polygon points="150,111 152,106 154,111" fill="#fbbf24" />
              
              {/* Torch arm */}
              <line x1="154" y1="125" x2="160" y2="115" stroke="#84cc16" strokeWidth="2" strokeLinecap="round" />
              
              {/* Torch */}
              <circle cx="161" cy="113" r="3" fill="#f97316" />
              <polygon points="158,110 161,108 164,110 161,113" fill="#fde047" />
            </g>

            {/* Empire State Building Minute Hand */}
            <g 
              style={{ 
                transformOrigin: '150px 150px',
                transform: `rotate(${minuteAngle}deg)`,
              }}
            >
              {/* Building base */}
              <rect x="148" y="140" width="4" height="15" fill="#6b7280" />
              
              {/* Middle section */}
              <rect x="148.5" y="125" width="3" height="15" fill="#9ca3af" />
              
              {/* Upper section */}
              <rect x="149" y="110" width="2" height="15" fill="#d1d5db" />
              
              {/* Spire */}
              <rect x="149.5" y="95" width="1" height="15" fill="#f3f4f6" />
              
              {/* Antenna */}
              <line x1="150" y1="95" x2="150" y2="85" stroke="#374151" strokeWidth="0.5" />
              
              {/* Building details - windows */}
              <rect x="148.2" y="128" width="0.3" height="0.5" fill="#1f2937" />
              <rect x="149" y="128" width="0.3" height="0.5" fill="#1f2937" />
              <rect x="149.8" y="128" width="0.3" height="0.5" fill="#1f2937" />
              <rect x="150.6" y="128" width="0.3" height="0.5" fill="#1f2937" />
              
              <rect x="148.2" y="132" width="0.3" height="0.5" fill="#1f2937" />
              <rect x="149" y="132" width="0.3" height="0.5" fill="#1f2937" />
              <rect x="149.8" y="132" width="0.3" height="0.5" fill="#1f2937" />
              <rect x="150.6" y="132" width="0.3" height="0.5" fill="#1f2937" />
            </g>

            {/* Center dot */}
            <circle
              cx="150"
              cy="150"
              r="5"
              fill="rgba(255, 255, 255, 0.9)"
              stroke="#7f1d1d"
              strokeWidth="2"
            />
          </svg>

          {/* NY Clock Title */}
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
            <h3 className="font-xanman-wide text-lg text-white text-center">
              NEW YORK TIME
            </h3>
          </div>

        </div>
      </div>

      {/* Traditional Analog Clock */}
      <div className="flex items-center justify-center pb-16">
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