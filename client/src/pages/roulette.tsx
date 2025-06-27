import { Link } from 'wouter';
import { useState, useEffect, useRef } from 'react';

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  active: boolean;
}

interface RouletteNumber {
  number: number;
  color: 'red' | 'black' | 'green';
  angle: number;
}

export default function Roulette() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [wheelRotation, setWheelRotation] = useState(0);
  const [wheelSpeed, setWheelSpeed] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [ball, setBall] = useState<Ball>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 8,
    active: false
  });
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouseAngle, setLastMouseAngle] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);

  // European roulette numbers and colors
  const rouletteNumbers: RouletteNumber[] = [
    { number: 0, color: 'green', angle: 0 },
    { number: 32, color: 'red', angle: 9.73 },
    { number: 15, color: 'black', angle: 19.46 },
    { number: 19, color: 'red', angle: 29.19 },
    { number: 4, color: 'black', angle: 38.92 },
    { number: 21, color: 'red', angle: 48.65 },
    { number: 2, color: 'black', angle: 58.38 },
    { number: 25, color: 'red', angle: 68.11 },
    { number: 17, color: 'black', angle: 77.84 },
    { number: 34, color: 'red', angle: 87.57 },
    { number: 6, color: 'black', angle: 97.30 },
    { number: 27, color: 'red', angle: 107.03 },
    { number: 13, color: 'black', angle: 116.76 },
    { number: 36, color: 'red', angle: 126.49 },
    { number: 11, color: 'black', angle: 136.22 },
    { number: 30, color: 'red', angle: 145.95 },
    { number: 8, color: 'black', angle: 155.68 },
    { number: 23, color: 'red', angle: 165.41 },
    { number: 10, color: 'black', angle: 175.14 },
    { number: 5, color: 'red', angle: 184.87 },
    { number: 24, color: 'black', angle: 194.60 },
    { number: 16, color: 'red', angle: 204.33 },
    { number: 33, color: 'black', angle: 214.06 },
    { number: 1, color: 'red', angle: 223.79 },
    { number: 20, color: 'black', angle: 233.52 },
    { number: 14, color: 'red', angle: 243.25 },
    { number: 31, color: 'black', angle: 252.98 },
    { number: 9, color: 'red', angle: 262.71 },
    { number: 22, color: 'black', angle: 272.44 },
    { number: 18, color: 'red', angle: 282.17 },
    { number: 29, color: 'black', angle: 291.90 },
    { number: 7, color: 'red', angle: 301.63 },
    { number: 28, color: 'black', angle: 311.36 },
    { number: 12, color: 'red', angle: 321.09 },
    { number: 35, color: 'black', angle: 330.82 },
    { number: 3, color: 'red', angle: 340.55 },
    { number: 26, color: 'black', angle: 350.28 }
  ];

  const centerX = 300;
  const centerY = 300;
  const wheelRadius = 250;
  const ballTrackRadius = 220;

  // Calculate mouse/touch angle relative to wheel center
  const getAngleFromPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left - centerX;
    const y = clientY - rect.top - centerY;
    return Math.atan2(y, x) * (180 / Math.PI);
  };

  // Handle mouse/touch start for spinning
  const handlePointerDown = (e: React.PointerEvent) => {
    if (ball.active) return; // Don't allow spinning while ball is active
    
    setIsDragging(true);
    setDragStartTime(Date.now());
    const angle = getAngleFromPoint(e.clientX, e.clientY);
    setLastMouseAngle(angle);
  };

  // Handle mouse/touch move for spinning
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    const currentAngle = getAngleFromPoint(e.clientX, e.clientY);
    let angleDiff = currentAngle - lastMouseAngle;
    
    // Handle angle wraparound
    if (angleDiff > 180) angleDiff -= 360;
    if (angleDiff < -180) angleDiff += 360;
    
    setWheelSpeed(angleDiff * 2); // Amplify movement for better feel
    setLastMouseAngle(currentAngle);
  };

  // Handle mouse/touch end for spinning
  const handlePointerUp = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    setIsSpinning(Math.abs(wheelSpeed) > 1);
  };

  // Drop ball on the wheel
  const dropBall = () => {
    if (ball.active || !isSpinning) return;
    
    // Start ball at random position on outer edge
    const startAngle = Math.random() * Math.PI * 2;
    const startRadius = ballTrackRadius + 30;
    
    setBall({
      x: centerX + Math.cos(startAngle) * startRadius,
      y: centerY + Math.sin(startAngle) * startRadius,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      radius: 8,
      active: true
    });
  };

  // Update physics
  useEffect(() => {
    const updatePhysics = () => {
      // Update wheel rotation
      if (isSpinning) {
        setWheelRotation(prev => prev + wheelSpeed);
        setWheelSpeed(prev => prev * 0.995); // Friction
        
        if (Math.abs(wheelSpeed) < 0.1) {
          setIsSpinning(false);
          setWheelSpeed(0);
        }
      }

      // Update ball physics
      if (ball.active) {
        const newBall = { ...ball };
        
        // Apply gravity and air resistance
        newBall.vy += 0.2;
        newBall.vx *= 0.998;
        newBall.vy *= 0.998;
        
        // Update position
        newBall.x += newBall.vx;
        newBall.y += newBall.vy;
        
        // Check collision with wheel edge
        const distanceFromCenter = Math.sqrt(
          (newBall.x - centerX) ** 2 + (newBall.y - centerY) ** 2
        );
        
        if (distanceFromCenter > ballTrackRadius - newBall.radius) {
          // Bounce off wheel edge
          const angle = Math.atan2(newBall.y - centerY, newBall.x - centerX);
          const normalX = Math.cos(angle);
          const normalY = Math.sin(angle);
          
          // Reflect velocity
          const dotProduct = newBall.vx * normalX + newBall.vy * normalY;
          newBall.vx -= 2 * dotProduct * normalX * 0.7; // Add some energy loss
          newBall.vy -= 2 * dotProduct * normalY * 0.7;
          
          // Push ball back inside
          newBall.x = centerX + normalX * (ballTrackRadius - newBall.radius);
          newBall.y = centerY + normalY * (ballTrackRadius - newBall.radius);
        }
        
        // Check if ball has settled (low velocity and near center)
        const velocity = Math.sqrt(newBall.vx ** 2 + newBall.vy ** 2);
        if (velocity < 1 && distanceFromCenter < ballTrackRadius - 50) {
          // Determine winning number based on ball position and wheel rotation
          const ballAngle = Math.atan2(newBall.y - centerY, newBall.x - centerX) * (180 / Math.PI);
          const adjustedAngle = (ballAngle - wheelRotation + 360) % 360;
          
          // Find the closest roulette number
          const closest = rouletteNumbers.reduce((prev, curr) => {
            const prevDiff = Math.abs(prev.angle - adjustedAngle);
            const currDiff = Math.abs(curr.angle - adjustedAngle);
            return currDiff < prevDiff ? curr : prev;
          });
          
          setWinningNumber(closest.number);
          newBall.active = false;
        }
        
        setBall(newBall);
      }
      
      animationRef.current = requestAnimationFrame(updatePhysics);
    };

    animationRef.current = requestAnimationFrame(updatePhysics);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [wheelSpeed, isSpinning, ball, wheelRotation]);

  // Draw the roulette wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save context for rotation
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((wheelRotation * Math.PI) / 180);
    
    // Draw wheel segments
    rouletteNumbers.forEach((segment, index) => {
      const startAngle = (segment.angle - 4.86) * (Math.PI / 180); // Half segment width
      const endAngle = (segment.angle + 4.86) * (Math.PI / 180);
      
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, wheelRadius, startAngle, endAngle);
      ctx.closePath();
      
      // Set color
      ctx.fillStyle = segment.color === 'red' ? '#dc2626' : 
                      segment.color === 'black' ? '#1f2937' : '#059669';
      ctx.fill();
      
      // Draw border
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw number
      ctx.save();
      ctx.rotate(segment.angle * (Math.PI / 180));
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(segment.number.toString(), wheelRadius - 30, 5);
      ctx.restore();
    });
    
    // Draw center circle
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI * 2);
    ctx.fillStyle = '#6b7280';
    ctx.fill();
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.restore();
    
    // Draw ball
    if (ball.active) {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#f3f4f6';
      ctx.fill();
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Draw pointer
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - wheelRadius - 20);
    ctx.lineTo(centerX - 10, centerY - wheelRadius - 5);
    ctx.lineTo(centerX + 10, centerY - wheelRadius - 5);
    ctx.closePath();
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.stroke();
    
  }, [wheelRotation, ball]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <Link href="/projects" className="text-blue-400 hover:text-blue-300 font-serif text-lg transition-colors" style={{fontFamily: 'Georgia, serif'}}>
          ← BACK TO PROJECTS
        </Link>
        <h1 className="text-4xl font-serif text-center mt-6 mb-2" style={{fontFamily: 'Georgia, serif'}}>
          XANDER WALKER
        </h1>
        <h2 className="text-2xl font-serif text-center text-gray-300" style={{fontFamily: 'Georgia, serif'}}>
          ROULETTE WHEEL
        </h2>
      </div>

      {/* Game Area */}
      <div className="max-w-4xl mx-auto">
        <div className="glassmorphism rounded-3xl p-8">
          
          {/* Winning Number Display */}
          {winningNumber !== null && (
            <div className="text-center mb-6">
              <div className="inline-block glassmorphism rounded-2xl px-8 py-4">
                <h3 className="font-serif text-xl mb-2" style={{fontFamily: 'Georgia, serif'}}>WINNING NUMBER</h3>
                <div className={`text-6xl font-serif font-bold ${
                  rouletteNumbers.find(n => n.number === winningNumber)?.color === 'red' ? 'text-red-400' :
                  rouletteNumbers.find(n => n.number === winningNumber)?.color === 'black' ? 'text-gray-300' :
                  'text-green-400'
                }`} style={{fontFamily: 'Georgia, serif'}}>
                  {winningNumber}
                </div>
              </div>
            </div>
          )}

          {/* Canvas */}
          <div className="flex justify-center mb-6">
            <canvas
              ref={canvasRef}
              width={600}
              height={600}
              className="border border-gray-600 rounded-lg cursor-pointer"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              style={{ touchAction: 'none' }}
            />
          </div>

          {/* Controls */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={dropBall}
              disabled={ball.active || !isSpinning}
              className={`font-serif px-6 py-3 rounded-lg text-lg font-bold transition-colors ${
                ball.active || !isSpinning
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
              style={{fontFamily: 'Georgia, serif'}}
            >
              DROP BALL
            </button>
            <button
              onClick={() => {
                setBall(prev => ({ ...prev, active: false }));
                setWinningNumber(null);
                setWheelSpeed(0);
                setIsSpinning(false);
              }}
              className="font-serif bg-gray-600 text-white px-6 py-3 rounded-lg text-lg font-bold hover:bg-gray-700 transition-colors"
              style={{fontFamily: 'Georgia, serif'}}
            >
              RESET
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-6 text-center text-sm text-gray-400 font-serif" style={{fontFamily: 'Georgia, serif'}}>
            <p>Drag the wheel to spin it, then drop the ball to play!</p>
            <p>The ball will bounce around and settle on a winning number.</p>
          </div>

        </div>
      </div>
    </div>
  );
}