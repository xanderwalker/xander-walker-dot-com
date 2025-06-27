import { Link } from 'wouter';
import { useState, useEffect, useRef } from 'react';

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isSettled: boolean;
  settledIndex?: number;
  ballSize?: number;
  color?: string;
}

interface PixelBall {
  id: number;
  x: number;
  y: number;
  vy: number;
  isSettled: boolean;
}

// Function to generate random ball colors
const getBallColor = (type: 'second' | 'minute' | 'hour') => {
  const colors = {
    second: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FFB6C1', '#87CEEB'],
    minute: ['#FF7675', '#00B894', '#0984E3', '#6C5CE7', '#FDCB6E', '#E17055', '#74B9FF', '#55A3FF'],
    hour: ['#E74C3C', '#16A085', '#2980B9', '#8E44AD', '#F39C12', '#D35400', '#3498DB', '#9B59B6']
  };
  const colorArray = colors[type];
  return colorArray[Math.floor(Math.random() * colorArray.length)];
};

// Year clock helper functions
const getDaysInMonth = (month: number, year: number) => {
  return new Date(year, month, 0).getDate();
};

const getMonthName = (month: number) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month];
};

const isDayPassed = (dayOfYear: number, currentDayOfYear: number) => {
  return dayOfYear < currentDayOfYear;
};

const getDayOfYear = (date: Date) => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

// Amoeba Clock Component
const AmoebaClockComponent = ({ currentTime }: { currentTime: Date }) => {
  const [morphPoints, setMorphPoints] = useState<number[]>([]);
  const [waterOffset, setWaterOffset] = useState(0);
  const [pulseScale, setPulseScale] = useState(1);
  
  const seconds = currentTime.getSeconds();
  const minutes = currentTime.getMinutes();
  
  // Generate color based on time
  const getTimeColor = () => {
    const hue = (seconds * 6) % 360; // Full spectrum over 60 seconds
    return `hsl(${hue}, 70%, 60%)`;
  };
  
  // Generate amoeba blob path
  const generateBlobPath = (points: number[]) => {
    if (points.length === 0) return '';
    
    const centerX = 150;
    const centerY = 150;
    const baseRadius = 80;
    
    let path = `M `;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radiusVariation = points[i] || 0.8;
      const radius = baseRadius * (0.6 + radiusVariation * 0.4);
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      if (i === 0) {
        path += `${x} ${y}`;
      } else {
        // Create smooth curves
        const prevAngle = ((i - 1) / 12) * Math.PI * 2;
        const prevRadius = baseRadius * (0.6 + (points[i - 1] || 0.8) * 0.4);
        const prevX = centerX + Math.cos(prevAngle) * prevRadius;
        const prevY = centerY + Math.sin(prevAngle) * prevRadius;
        
        const cpX = (prevX + x) / 2 + Math.sin(angle) * 20;
        const cpY = (prevY + y) / 2 + Math.cos(angle) * 20;
        
        path += ` Q ${cpX} ${cpY} ${x} ${y}`;
      }
    }
    path += ' Z';
    return path;
  };
  
  useEffect(() => {
    // Morph animation
    const morphInterval = setInterval(() => {
      setMorphPoints(prev => {
        const newPoints = prev.map(point => {
          return Math.max(0.3, Math.min(1.2, point + (Math.random() - 0.5) * 0.1));
        });
        
        // Add or remove points occasionally
        if (newPoints.length < 12) {
          while (newPoints.length < 12) {
            newPoints.push(0.8 + Math.random() * 0.4);
          }
        }
        return newPoints;
      });
    }, 150);
    
    // Water sloshing animation
    const waterInterval = setInterval(() => {
      setWaterOffset(prev => (prev + 1) % 360);
    }, 50);
    
    // Pulse animation on second change
    const pulseInterval = setInterval(() => {
      setPulseScale(1.15);
      setTimeout(() => setPulseScale(1), 100);
    }, 1000);
    
    return () => {
      clearInterval(morphInterval);
      clearInterval(waterInterval);
      clearInterval(pulseInterval);
    };
  }, []);
  
  // Initialize morph points
  useEffect(() => {
    if (morphPoints.length === 0) {
      setMorphPoints(Array.from({ length: 12 }, () => 0.8 + Math.random() * 0.4));
    }
  }, [morphPoints.length]);
  
  const blobPath = generateBlobPath(morphPoints);
  const timeColor = getTimeColor();
  
  return (
    <div className="relative w-80 h-80 mx-auto">
      <svg width="300" height="300" viewBox="0 0 300 300" className="drop-shadow-2xl">
        {/* Amoeba shape with gradient */}
        <defs>
          <radialGradient id="amoebaGradient" cx="0.3" cy="0.3">
            <stop offset="0%" stopColor={timeColor} stopOpacity="0.9" />
            <stop offset="50%" stopColor={timeColor} stopOpacity="0.7" />
            <stop offset="100%" stopColor={timeColor} stopOpacity="0.5" />
          </radialGradient>
          
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="8" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
          
          <clipPath id="amoebaClip">
            <path d={blobPath} />
          </clipPath>
        </defs>
        
        {/* Main amoeba body */}
        <path
          d={blobPath}
          fill="url(#amoebaGradient)"
          filter="url(#gooey)"
          style={{
            transform: `scale(${pulseScale})`,
            transformOrigin: 'center',
            transition: 'transform 0.1s ease-out'
          }}
        />
        
        {/* Water sloshing inside */}
        <g clipPath="url(#amoebaClip)">
          <ellipse
            cx="150"
            cy="150"
            rx="60"
            ry="40"
            fill="rgba(100, 200, 255, 0.6)"
            style={{
              transform: `translate(${Math.sin(waterOffset * 0.02) * 10}px, ${Math.cos(waterOffset * 0.03) * 8}px) rotate(${waterOffset * 0.5}deg)`,
              transformOrigin: 'center'
            }}
          />
          <ellipse
            cx="150"
            cy="150"
            rx="45"
            ry="30"
            fill="rgba(150, 220, 255, 0.4)"
            style={{
              transform: `translate(${Math.cos(waterOffset * 0.025) * 8}px, ${Math.sin(waterOffset * 0.035) * 6}px) rotate(${-waterOffset * 0.3}deg)`,
              transformOrigin: 'center'
            }}
          />
        </g>
        
        {/* Glossy highlight */}
        <ellipse
          cx="130"
          cy="120"
          rx="25"
          ry="35"
          fill="rgba(255, 255, 255, 0.3)"
          style={{
            transform: `scale(${pulseScale * 0.9})`,
            transformOrigin: 'center',
            transition: 'transform 0.1s ease-out'
          }}
        />
      </svg>
      
      {/* Time display inside */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center font-xanman-wide text-white drop-shadow-lg">
          <div className="text-2xl font-bold">
            {String(currentTime.getHours()).padStart(2, '0')}:{String(minutes).padStart(2, '0')}
          </div>
          <div className="text-lg opacity-80">
            {String(seconds).padStart(2, '0')}
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Amoeba Clock with Hands Component
const AmoebaWithHandsClockComponent = ({ currentTime }: { currentTime: Date }) => {
  const [morphPoints, setMorphPoints] = useState<number[]>([]);
  const [waterOffset, setWaterOffset] = useState(0);
  const [pulseScale, setPulseScale] = useState(1);
  const [handMorph, setHandMorph] = useState({ hour: 1, minute: 1 });
  
  const seconds = currentTime.getSeconds();
  const minutes = currentTime.getMinutes();
  const hours = currentTime.getHours() % 12;
  
  // Generate color based on time
  const getTimeColor = () => {
    const hue = (seconds * 6) % 360;
    return `hsl(${hue}, 70%, 60%)`;
  };
  
  // Generate hand colors
  const getHourHandColor = () => {
    const hue = (hours * 30 + minutes * 0.5) % 360; // 30 degrees per hour
    return `hsl(${hue}, 80%, 55%)`;
  };
  
  const getMinuteHandColor = () => {
    const hue = (minutes * 6) % 360; // 6 degrees per minute
    return `hsl(${hue}, 75%, 50%)`;
  };
  
  // Calculate hand angles
  const hourAngle = (hours * 30) + (minutes * 0.5) - 90; // -90 to start at 12 o'clock
  const minuteAngle = (minutes * 6) - 90;
  
  // Generate amoeba blob path
  const generateBlobPath = (points: number[]) => {
    if (points.length === 0) return '';
    
    const centerX = 150;
    const centerY = 150;
    const baseRadius = 80;
    
    let path = `M `;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radiusVariation = points[i] || 0.8;
      const radius = baseRadius * (0.6 + radiusVariation * 0.4);
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      if (i === 0) {
        path += `${x} ${y}`;
      } else {
        const prevAngle = ((i - 1) / 12) * Math.PI * 2;
        const prevRadius = baseRadius * (0.6 + (points[i - 1] || 0.8) * 0.4);
        const prevX = centerX + Math.cos(prevAngle) * prevRadius;
        const prevY = centerY + Math.sin(prevAngle) * prevRadius;
        
        const cpX = (prevX + x) / 2 + Math.sin(angle) * 20;
        const cpY = (prevY + y) / 2 + Math.cos(angle) * 20;
        
        path += ` Q ${cpX} ${cpY} ${x} ${y}`;
      }
    }
    path += ' Z';
    return path;
  };
  
  // Generate morphing oval hand path
  const generateHandPath = (length: number, width: number, morphFactor: number) => {
    const morphedWidth = width * morphFactor;
    const morphedLength = length * (0.8 + morphFactor * 0.4);
    
    return `M 0,-${morphedWidth/2} 
            Q ${morphedLength*0.3},-${morphedWidth/2} ${morphedLength},-${morphedWidth/4}
            Q ${morphedLength*1.1},0 ${morphedLength},${morphedWidth/4}
            Q ${morphedLength*0.3},${morphedWidth/2} 0,${morphedWidth/2}
            Q -${morphedWidth/3},0 0,-${morphedWidth/2} Z`;
  };
  
  useEffect(() => {
    // Morph animation
    const morphInterval = setInterval(() => {
      setMorphPoints(prev => {
        const newPoints = prev.map(point => {
          return Math.max(0.3, Math.min(1.2, point + (Math.random() - 0.5) * 0.1));
        });
        
        if (newPoints.length < 12) {
          while (newPoints.length < 12) {
            newPoints.push(0.8 + Math.random() * 0.4);
          }
        }
        return newPoints;
      });
      
      // Morph hands
      setHandMorph({
        hour: 0.7 + Math.random() * 0.6,
        minute: 0.8 + Math.random() * 0.4
      });
    }, 200);
    
    // Water sloshing animation
    const waterInterval = setInterval(() => {
      setWaterOffset(prev => (prev + 1) % 360);
    }, 50);
    
    // Pulse animation on second change
    const pulseInterval = setInterval(() => {
      setPulseScale(1.15);
      setTimeout(() => setPulseScale(1), 100);
    }, 1000);
    
    return () => {
      clearInterval(morphInterval);
      clearInterval(waterInterval);
      clearInterval(pulseInterval);
    };
  }, []);
  
  // Initialize morph points
  useEffect(() => {
    if (morphPoints.length === 0) {
      setMorphPoints(Array.from({ length: 12 }, () => 0.8 + Math.random() * 0.4));
    }
  }, [morphPoints.length]);
  
  const blobPath = generateBlobPath(morphPoints);
  const timeColor = getTimeColor();
  const hourHandColor = getHourHandColor();
  const minuteHandColor = getMinuteHandColor();
  
  return (
    <div className="relative w-80 h-80 mx-auto">
      <svg width="300" height="300" viewBox="0 0 300 300" className="drop-shadow-2xl">
        <defs>
          <radialGradient id="amoebaGradientHands" cx="0.3" cy="0.3">
            <stop offset="0%" stopColor={timeColor} stopOpacity="0.9" />
            <stop offset="50%" stopColor={timeColor} stopOpacity="0.7" />
            <stop offset="100%" stopColor={timeColor} stopOpacity="0.5" />
          </radialGradient>
          
          <radialGradient id="hourHandGradient" cx="0.3" cy="0.3">
            <stop offset="0%" stopColor={hourHandColor} stopOpacity="0.9" />
            <stop offset="100%" stopColor={hourHandColor} stopOpacity="0.6" />
          </radialGradient>
          
          <radialGradient id="minuteHandGradient" cx="0.3" cy="0.3">
            <stop offset="0%" stopColor={minuteHandColor} stopOpacity="0.9" />
            <stop offset="100%" stopColor={minuteHandColor} stopOpacity="0.6" />
          </radialGradient>
          
          <filter id="gooeyHands">
            <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="8" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
          
          <clipPath id="amoebaClipHands">
            <path d={blobPath} />
          </clipPath>
        </defs>
        
        {/* Main amoeba body */}
        <path
          d={blobPath}
          fill="url(#amoebaGradientHands)"
          filter="url(#gooeyHands)"
          style={{
            transform: `scale(${pulseScale})`,
            transformOrigin: 'center',
            transition: 'transform 0.1s ease-out'
          }}
        />
        
        {/* Water sloshing inside */}
        <g clipPath="url(#amoebaClipHands)">
          <ellipse
            cx="150"
            cy="150"
            rx="60"
            ry="40"
            fill="rgba(100, 200, 255, 0.6)"
            style={{
              transform: `translate(${Math.sin(waterOffset * 0.02) * 10}px, ${Math.cos(waterOffset * 0.03) * 8}px) rotate(${waterOffset * 0.5}deg)`,
              transformOrigin: 'center'
            }}
          />
          <ellipse
            cx="150"
            cy="150"
            rx="45"
            ry="30"
            fill="rgba(150, 220, 255, 0.4)"
            style={{
              transform: `translate(${Math.cos(waterOffset * 0.025) * 8}px, ${Math.sin(waterOffset * 0.035) * 6}px) rotate(${-waterOffset * 0.3}deg)`,
              transformOrigin: 'center'
            }}
          />
        </g>
        
        {/* Hour Hand */}
        <g transform={`translate(150, 150) rotate(${hourAngle})`}>
          <path
            d={generateHandPath(50, 16, handMorph.hour)}
            fill="url(#hourHandGradient)"
            filter="url(#gooeyHands)"
            style={{
              transformOrigin: 'center',
              transition: 'all 0.2s ease-out'
            }}
          />
        </g>
        
        {/* Minute Hand */}
        <g transform={`translate(150, 150) rotate(${minuteAngle})`}>
          <path
            d={generateHandPath(70, 12, handMorph.minute)}
            fill="url(#minuteHandGradient)"
            filter="url(#gooeyHands)"
            style={{
              transformOrigin: 'center',
              transition: 'all 0.2s ease-out'
            }}
          />
        </g>
        
        {/* Center dot */}
        <circle
          cx="150"
          cy="150"
          r="8"
          fill="rgba(255, 255, 255, 0.8)"
          filter="url(#gooeyHands)"
        />
        
        {/* Glossy highlight */}
        <ellipse
          cx="130"
          cy="120"
          rx="25"
          ry="35"
          fill="rgba(255, 255, 255, 0.3)"
          style={{
            transform: `scale(${pulseScale * 0.9})`,
            transformOrigin: 'center',
            transition: 'transform 0.1s ease-out'
          }}
        />
      </svg>
      
      {/* Digital time display below */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center">
        <div className="font-xanman-wide text-white text-lg drop-shadow-lg bg-black bg-opacity-30 px-3 py-1 rounded-lg">
          {String(currentTime.getHours()).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>
    </div>
  );
};

const PixelClockComponent = ({ currentTime }: { currentTime: Date }) => {
  const [pixelBalls, setPixelBalls] = useState<PixelBall[]>([]);
  const ballIdRef = useRef(0);
  const lastSecondRef = useRef(-1);
  const animationFrameRef = useRef<number>();

  // Drop 10 balls every second
  useEffect(() => {
    const currentSecond = currentTime.getSeconds();
    
    if (lastSecondRef.current !== currentSecond) {
      lastSecondRef.current = currentSecond;
      
      // Clear all balls at the start of each minute
      if (currentSecond === 0) {
        setPixelBalls([]);
        return;
      }
      
      // Drop 10 new pixel balls
      const newBalls: PixelBall[] = [];
      for (let i = 0; i < 10; i++) {
        newBalls.push({
          id: ballIdRef.current++,
          x: 38 + Math.random() * 4, // Random position across cylinder width
          y: 0,
          vy: 0.5 + Math.random() * 0.5,
          isSettled: false
        });
      }
      
      setPixelBalls(prev => [...prev, ...newBalls]);
    }
  }, [currentTime]);

  // Physics animation for sand-like stacking
  useEffect(() => {
    const animate = () => {
      setPixelBalls(prev => {
        const settledPositions = new Set<string>();
        const newBalls = [...prev];
        
        // First pass: record all settled ball positions
        newBalls.forEach(ball => {
          if (ball.isSettled) {
            settledPositions.add(`${Math.round(ball.x)},${Math.round(ball.y)}`);
          }
        });
        
        // Second pass: update moving balls
        return newBalls.map(ball => {
          if (ball.isSettled) return ball;
          
          let newY = ball.y + ball.vy;
          let newX = ball.x;
          let newVy = ball.vy + 0.08; // Increased gravity for faster settling
          let newIsSettled = false;
          
          const cylinderBottom = 278;
          const cylinderLeft = 38;
          const cylinderRight = 42;
          
          // Add horizontal spreading force when ball is near settling
          if (ball.vy > 1) {
            // Add small random horizontal movement for better spreading
            newX += (Math.random() - 0.5) * 0.3;
          }
          
          // Constrain to cylinder walls
          if (newX < cylinderLeft) newX = cylinderLeft;
          if (newX > cylinderRight) newX = cylinderRight;
          
          // Check collision with bottom or other balls
          const roundedX = Math.round(newX);
          const roundedY = Math.round(newY);
          
          // Check if position below is occupied or at bottom
          if (roundedY >= cylinderBottom || settledPositions.has(`${roundedX},${roundedY + 1}`)) {
            // Find the lowest available position (bottom-up filling)
            let finalY = cylinderBottom;
            let finalX = roundedX;
            let found = false;
            
            // Start from bottom and work up, checking each row
            for (let y = cylinderBottom; y >= 0 && !found; y--) {
              // Check center position first
              if (!settledPositions.has(`${roundedX},${y}`)) {
                finalY = y;
                finalX = roundedX;
                found = true;
                break;
              }
              
              // If center occupied, spread outward
              for (let spread = 1; spread <= 2 && !found; spread++) {
                const leftX = roundedX - spread;
                const rightX = roundedX + spread;
                
                // Try left side
                if (leftX >= cylinderLeft && !settledPositions.has(`${leftX},${y}`)) {
                  finalY = y;
                  finalX = leftX;
                  found = true;
                  break;
                }
                
                // Try right side
                if (rightX <= cylinderRight && !settledPositions.has(`${rightX},${y}`)) {
                  finalY = y;
                  finalX = rightX;
                  found = true;
                  break;
                }
              }
            }
            
            newY = finalY;
            newX = finalX;
            newVy = 0;
            newIsSettled = true;
            settledPositions.add(`${finalX},${finalY}`);
          }
          
          return {
            ...ball,
            x: newX,
            y: newY,
            vy: newVy,
            isSettled: newIsSettled
          };
        });
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="flex justify-center">
      <div className="flex flex-col items-center">
        <div className="font-serif text-lg mb-2 text-black" style={{fontFamily: 'Georgia, serif'}}>Seconds</div>
        <div className="relative w-20 h-80 overflow-hidden" style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
          borderRadius: '8px',
          border: '2px solid rgba(0,0,0,0.1)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
        }}>
          
          {/* Second markers */}
          {[...Array(12)].map((_, i) => (
            <div key={i} className="absolute left-0 text-xs text-gray-600" style={{
              fontFamily: 'Georgia, serif',
              top: `${(i + 1) * (280 / 12) - 8}px`,
              fontSize: '8px'
            }}>
              {60 - (i + 1) * 5}
            </div>
          ))}
          
          {/* Render pixel balls */}
          {pixelBalls.map(ball => (
            <div
              key={ball.id}
              className="absolute w-1 h-1 bg-blue-600"
              style={{
                left: `${ball.x}px`,
                top: `${ball.y}px`
              }}
            />
          ))}
          
        </div>
        <div className="text-sm mt-2 text-center text-black font-serif" style={{fontFamily: 'Georgia, serif'}}>
          <div>Balls: {pixelBalls.length}</div>
          <div>Settled: {pixelBalls.filter(b => b.isSettled).length}</div>
        </div>
      </div>
    </div>
  );
};

const YearClock = ({ currentDate }: { currentDate: Date }) => {
  const currentYear = currentDate.getFullYear();
  const currentDayOfYear = getDayOfYear(currentDate);
  const totalDays = 365;
  
  return (
    <div className="w-full max-w-5xl">
      <div className="text-center mb-6">
        <h3 className="font-xanman-wide text-lg text-black mb-1">
          YEAR PROGRESS {currentYear}
        </h3>
        <div className="font-xanman-wide text-2xl font-bold text-black">
          {Math.round((currentDayOfYear / totalDays) * 100)}%
        </div>
        <div className="font-xanman-wide text-sm text-gray-600">
          DAY {currentDayOfYear} OF {totalDays}
        </div>
      </div>
      
      {/* Simple Progress Bar */}
      <div className="w-full h-8 bg-gray-200 rounded-lg overflow-hidden">
        {/* Red progress fill */}
        <div 
          className="h-full bg-red-500 transition-all duration-1000"
          style={{ width: `${(currentDayOfYear / totalDays) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default function Clock() {
  const [time, setTime] = useState(new Date());
  const [secondBalls, setSecondBalls] = useState<Ball[]>([]);
  const [minuteBalls, setMinuteBalls] = useState<Ball[]>([]);
  const [hourBalls, setHourBalls] = useState<Ball[]>([]);
  const ballIdRef = useRef(0);
  const lastSecondRef = useRef(-1);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now);
      
      const currentSecond = now.getSeconds();
      const currentMinute = now.getMinutes();
      const currentHour = now.getHours(); // 24-hour time
      
      // Add new ball every second
      if (currentSecond !== lastSecondRef.current) {
        lastSecondRef.current = currentSecond;
        
        if (currentSecond === 0) {
          // Reset seconds, add to minutes
          setSecondBalls([]);
          setMinuteBalls(prev => {
            const newBall: Ball = { 
              id: ballIdRef.current++, 
              x: 40, // Center of cylinder (80px width / 2)
              y: -20, // Start above cylinder
              vx: (Math.random() - 0.5) * 3, // More horizontal velocity for bounce
              vy: 0.5, // Small initial downward velocity
              isSettled: false,
              ballSize: 20, // Calculated size for minutes (60 ball capacity)
              color: getBallColor('minute')
            };
            const newBalls = [...prev, newBall];
            return newBalls.slice(-currentMinute || -60);
          });
          
          // If minute is 0, add to hours
          if (currentMinute === 0) {
            setMinuteBalls([]);
            setHourBalls(prev => {
              const newBall: Ball = { 
                id: ballIdRef.current++, 
                x: 40, 
                y: -30, // Start higher for larger balls
                vx: (Math.random() - 0.5) * 2.5, // More velocity for bigger bounces
                vy: 0, 
                isSettled: false,
                ballSize: 41, // Calculated size for hours (24 ball capacity)
                color: getBallColor('hour')
              };
              const newBalls = [...prev, newBall];
              return newBalls.slice(-currentHour || -24);
            });
          }
        } else {
          // Add ball to seconds
          const newBall: Ball = { 
            id: ballIdRef.current++, 
            x: 40, 
            y: -20, 
            vx: (Math.random() - 0.5) * 3, 
            vy: 0.5, 
            isSettled: false,
            ballSize: 20, // Calculated size for seconds (60 ball capacity)
            color: getBallColor('second')
          };
          setSecondBalls(prev => [...prev, newBall]);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Initialize balls based on current time
  useEffect(() => {
    const now = new Date();
    const seconds = now.getSeconds();
    const minutes = now.getMinutes();
    const hours = now.getHours(); // 24-hour time
    
    // Helper function to create naturally settled balls with proper spacing
    const createSettledBalls = (count: number, ballSize: number = 16, ballType: 'second' | 'minute' | 'hour' = 'second') => {
      const balls: Ball[] = [];
      const ballRadius = ballSize / 2;
      const minDistance = ballRadius * 2.2;
      const cylinderWidth = 76; // 80px total - 4px margins (2px each side)
      const cylinderLeft = 18; // Adjusted left margin
      const bottomY = 320 - ballSize - 8; // Bottom position for this ball size
      
      for (let i = 0; i < count; i++) {
        let attempts = 0;
        let validPosition = false;
        let x, y;
        
        // Try to find a valid position that doesn't overlap
        while (!validPosition && attempts < 50) {
          // Calculate rough layer based on how many balls we can fit per layer
          const ballsPerLayer = Math.floor(cylinderWidth / minDistance);
          const layer = Math.floor(i / ballsPerLayer);
          const positionInLayer = i % ballsPerLayer;
          
          // Position within the layer with some randomness
          x = cylinderLeft + (positionInLayer * minDistance) + (Math.random() * 8 - 4);
          y = bottomY - (layer * minDistance) - (Math.random() * 4);
          
          // Ensure within cylinder bounds with proper radius consideration
          const minX = cylinderLeft + ballRadius;
          const maxX = cylinderLeft + cylinderWidth - ballRadius;
          x = Math.max(minX, Math.min(maxX, x));
          y = Math.max(ballRadius, y);
          
          // Check if this position overlaps with existing balls
          validPosition = true;
          for (const existingBall of balls) {
            const existingBallSize = existingBall.ballSize || 16;
            const existingBallRadius = existingBallSize / 2;
            const dx = x - existingBall.x;
            const dy = y - existingBall.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const requiredDistance = (ballRadius + existingBallRadius) * 1.1;
            
            if (distance < requiredDistance) {
              validPosition = false;
              break;
            }
          }
          attempts++;
        }
        
        // If we couldn't find a good position, place it safely within bounds
        if (!validPosition) {
          const safeX = cylinderLeft + ballRadius + (Math.random() * (cylinderWidth - ballRadius * 2));
          x = Math.max(cylinderLeft + ballRadius, Math.min(cylinderLeft + cylinderWidth - ballRadius, safeX));
          y = bottomY - i * ballRadius; // Stack higher if needed
        }
        
        balls.push({
          id: ballIdRef.current++,
          x: x!,
          y: y!,
          vx: (Math.random() - 0.5) * 0.5, // Small random velocity for subtle movement
          vy: (Math.random() - 0.5) * 0.3,
          isSettled: false, // Start as dynamic, not settled
          ballSize: ballSize,
          color: getBallColor(ballType)
        });
      }
      return balls;
    };
    
    setSecondBalls(createSettledBalls(seconds, 20, 'second'));
    setMinuteBalls(createSettledBalls(minutes, 20, 'minute'));
    setHourBalls(createSettledBalls(hours, 41, 'hour'));
  }, []);

  // Physics animation loop
  useEffect(() => {
    const animate = () => {
      const updateBalls = (balls: Ball[], setBalls: React.Dispatch<React.SetStateAction<Ball[]>>) => {
        setBalls(prevBalls => 
          prevBalls.map(ball => {
            // Remove the settled check - all balls should always be affected by physics
            // if (ball.isSettled) return ball;

            let newX = ball.x + ball.vx;
            let newY = ball.y + ball.vy;
            let newVx = ball.vx;
            let newVy = ball.vy + 1.2; // Much stronger gravity for heavier balls
            
            // Calculate depth-based stability (balls lower in cylinder are more stable)
            const cylinderHeight = 320;
            const depthRatio = Math.max(0, (cylinderHeight - ball.y) / cylinderHeight); // 0 at top, 1 at bottom
            const stabilityFactor = Math.pow(depthRatio, 2); // Quadratic for more dramatic effect
            
            // Add random forces - less for deeper balls
            const randomForce = 0.02 * (1 - stabilityFactor * 0.8); // Reduce random forces for deep balls
            newVx += (Math.random() - 0.5) * randomForce;
            newVy += (Math.random() - 0.5) * randomForce;

            // Get ball size and radius for calculations
            const currentBallSize = ball.ballSize || 16;
            const currentBallRadius = currentBallSize / 2;

            // Wall collisions (cylinder walls) - proper boundary enforcement
            const leftWall = 18 + currentBallRadius; // Ball center must be at least radius away from wall
            const rightWall = 76 - currentBallRadius;
            
            if (newX <= leftWall) { // Left wall
              newX = leftWall;
              newVx = -newVx * 0.4; // Less bounce for heavier balls
            }
            if (newX >= rightWall) { // Right wall  
              newX = rightWall;
              newVx = -newVx * 0.4; // Less bounce for heavier balls
            }

            // Check collision with other balls and bottom
            const otherBalls = prevBalls.filter(b => b.id !== ball.id);
            let hasCollision = false;
            
            // Check collision with other balls (both settled and moving)
            for (const otherBall of otherBalls) {
              const dx = newX - otherBall.x;
              const dy = newY - otherBall.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const otherBallSize = otherBall.ballSize || 16;
              const otherBallRadius = otherBallSize / 2;
              const minDistance = currentBallRadius + otherBallRadius; // Exact contact, no overlap
              
              if (distance < minDistance && distance > 0) {
                // Separate balls to prevent overlap - stronger separation
                const overlap = minDistance - distance;
                const separationForce = overlap * 1.0; // Stronger separation
                
                const angle = Math.atan2(dy, dx);
                newX += Math.cos(angle) * separationForce;
                newY += Math.sin(angle) * separationForce;
                
                // Enhanced bouncing - strength depends on depth of both balls
                const otherDepthRatio = Math.max(0, (cylinderHeight - otherBall.y) / cylinderHeight);
                const otherStabilityFactor = Math.pow(otherDepthRatio, 2);
                const avgStability = (stabilityFactor + otherStabilityFactor) / 2;
                
                const bounceForce = 1.0 * (1 - avgStability * 0.6); // Reduced bounce force for heavier balls
                const relativeVelocity = Math.sqrt((ball.vx - otherBall.vx) ** 2 + (ball.vy - otherBall.vy) ** 2);
                const velocityMultiplier = Math.max(0.3, Math.min(2.0, relativeVelocity * 0.3));
                
                newVx += Math.cos(angle) * bounceForce * velocityMultiplier;
                newVy += Math.sin(angle) * bounceForce * velocityMultiplier;
                
                // More damping for heavier balls
                const dampingFactor = 0.8 - (stabilityFactor * 0.4);
                newVx *= dampingFactor;
                newVy *= dampingFactor;
                
                hasCollision = true;
              }
            }
            
            // Bottom collision (cylinder bottom) - proper boundary enforcement
            const bottomBoundary = 320 - currentBallRadius - 8; // Ball center position at bottom
            if (newY >= bottomBoundary) {
              newY = bottomBoundary;
              newVy = -newVy * 0.3; // Less bounce for heavier balls
              newVx *= 0.7; // More friction for heavier feel
              hasCollision = true;
            }
            
            // Apply velocity caps
            if (Math.abs(newVx) > 10) newVx *= 0.95;
            if (Math.abs(newVy) > 15) newVy *= 0.95;
            
            // Depth-based energy damping - deeper balls lose energy faster
            const baseDamping = 0.999;
            const depthDamping = baseDamping - (stabilityFactor * 0.005); // More damping for deeper balls
            newVx *= depthDamping;
            newVy *= depthDamping;

            return {
              ...ball,
              x: newX,
              y: newY,
              vx: newVx,
              vy: newVy
            };
          })
        );
      };

      updateBalls(secondBalls, setSecondBalls);
      updateBalls(minuteBalls, setMinuteBalls);
      updateBalls(hourBalls, setHourBalls);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [secondBalls, minuteBalls, hourBalls]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const GraduatedCylinder = ({ balls, maxBalls, label, unit }: { 
    balls: Ball[], 
    maxBalls: number, 
    label: string,
    unit: string 
  }) => {
    // Calculate ball sizes based on cylinder volume and capacity
    const isHourCylinder = label === "Hours";
    
    // Cylinder dimensions: 80px wide × 320px tall = 25,600 px² total area
    // For seconds/minutes: 60 balls should fill cylinder (30 balls = 50% mark)
    // For hours: 12 balls should fill cylinder (6 balls = 50% mark)
    // Using ~70% packing efficiency to account for spacing and realistic physics
    
    const cylinderArea = 80 * 320;
    const packingEfficiency = 0.7;
    
    let ballSize;
    if (isHourCylinder) {
      // 24 balls should fill the cylinder (24-hour time)
      const ballArea = (cylinderArea * packingEfficiency) / 24;
      const ballRadius = Math.sqrt(ballArea / Math.PI);
      ballSize = Math.round(ballRadius * 2);
    } else {
      // 60 balls should fill the cylinder  
      const ballArea = (cylinderArea * packingEfficiency) / 60;
      const ballRadius = Math.sqrt(ballArea / Math.PI);
      ballSize = Math.round(ballRadius * 2);
    }
    return (
      <div className="flex flex-col items-center">
        <div className="font-serif text-lg mb-2" style={{fontFamily: 'Georgia, serif'}}>{label}</div>
        <div className="relative w-20 h-80 overflow-hidden" style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(230,230,230,0.7) 50%, rgba(255,255,255,0.9) 100%)',
          borderRadius: '0 0 20px 20px',
          border: '3px solid rgba(200,200,200,0.8)',
          borderTop: '1px solid rgba(150,150,150,0.5)',
          boxShadow: 'inset -8px 0 16px rgba(0,0,0,0.1), inset 8px 0 16px rgba(255,255,255,0.3), 0 8px 32px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(2px)'
        }}>
          {/* Glass highlight effect */}
          <div className="absolute left-1 top-0 w-1 h-full bg-gradient-to-b from-white via-transparent to-transparent opacity-40 rounded-full"></div>
          <div className="absolute right-1 top-0 w-2 h-full bg-gradient-to-b from-transparent via-black to-transparent opacity-10 rounded-full"></div>
          {/* Graduated markings - quarter intervals */}
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="absolute right-0 w-full border-t border-gray-300" 
                 style={{ bottom: `${(i / 4) * 100}%` }}>
              <span className="absolute -right-8 text-xs text-gray-600 transform -translate-y-1/2">
                {Math.round((4 - i) / 4 * maxBalls)}
              </span>
            </div>
          ))}
          
          {/* Balls */}
          {balls.map((ball) => {
            const currentBallSize = ball.ballSize || ballSize;
            const ballColor = ball.color || '#4ECDC4';
            return (
              <div
                key={ball.id}
                className="absolute rounded-full"
                style={{
                  width: `${currentBallSize}px`,
                  height: `${currentBallSize}px`,
                  left: `${ball.x - currentBallSize/2}px`, // Center the ball
                  bottom: `${320 - ball.y - currentBallSize}px`, // Position from bottom
                  backgroundColor: ballColor,
                  border: `1px solid ${ballColor}dd`,
                  transition: 'none', // Let physics handle movement
                  zIndex: 5 // All balls have same z-index since they're all dynamic
                }}
              />
            );
          })}
        </div>
        <div className="font-serif text-sm mt-1 text-gray-600" style={{fontFamily: 'Georgia, serif'}}>
          {balls.length} {unit}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header with navigation back to projects */}
      <header className="p-8 flex justify-between items-center">
        <Link href="/projects">
          <button className="text-black hover:text-gray-600 transition-colors text-lg">
            ← BACK TO PROJECTS
          </button>
        </Link>
        
        <Link href="/">
          <h1 className="text-black font-xanman-wide font-bold text-4xl md:text-6xl hover:opacity-70 transition-opacity duration-200 cursor-pointer">
            XANDER WALKER
          </h1>
        </Link>
        
        <div className="w-48"></div> {/* Spacer for center alignment */}
      </header>

      {/* Clocks Display */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] space-y-12">
        
        {/* Pixel Ball Drop Clock */}
        <div className="glassmorphism rounded-2xl p-8">
          <h2 className="font-serif text-2xl mb-8 text-center text-black" style={{fontFamily: 'Georgia, serif'}}>
            PIXEL BALL CLOCK
          </h2>
          <PixelClockComponent currentTime={time} />
        </div>
        
        {/* Enhanced Amoeba Clock with Hands */}
        <div className="glassmorphism rounded-2xl p-8">
          <h2 className="font-xanman-wide text-2xl mb-8 text-center text-black">
            AMOEBA ANALOG CLOCK
          </h2>
          <AmoebaWithHandsClockComponent currentTime={time} />
        </div>
        
        {/* Amoeba Clock */}
        <div className="glassmorphism rounded-2xl p-8">
          <h2 className="font-xanman-wide text-2xl mb-8 text-center text-black">
            AMOEBA CLOCK
          </h2>
          <AmoebaClockComponent currentTime={time} />
        </div>
        
        {/* Year Clock */}
        <div className="glassmorphism rounded-2xl p-8 w-full max-w-6xl">
          <h2 className="font-serif text-2xl mb-8 text-center text-black" style={{fontFamily: 'Georgia, serif'}}>
            Year Progress Clock
          </h2>
          <YearClock currentDate={time} />
        </div>
        
        {/* Graduated Cylinder Clock */}
        <div className="glassmorphism rounded-2xl p-8">
          <h2 className="font-serif text-2xl mb-8 text-center text-black" style={{fontFamily: 'Georgia, serif'}}>
            Ball Drop Clock
          </h2>
          <div className="flex justify-center space-x-8">
            <GraduatedCylinder 
              balls={hourBalls} 
              maxBalls={12} 
              label="Hours" 
              unit="hrs"
            />
            <GraduatedCylinder 
              balls={minuteBalls} 
              maxBalls={60} 
              label="Minutes" 
              unit="min"
            />
            <GraduatedCylinder 
              balls={secondBalls} 
              maxBalls={60} 
              label="Seconds" 
              unit="sec"
            />
          </div>
        </div>

        {/* Digital Clock */}
        <div className="glassmorphism rounded-2xl p-12 text-center">
          <div className="font-xanman-wide text-6xl md:text-7xl mb-4 text-black tracking-wider">
            {formatTime(time)}
          </div>
          <div className="text-xl text-gray-600 uppercase tracking-widest">
            {formatDate(time)}
          </div>
        </div>
      </div>
    </div>
  );
}