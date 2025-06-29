import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'wouter';
import tennisBallImage from '@assets/IMG_3011_1751173717471.png';

interface TennisBall {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
}

interface Gladiator {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  health: number;
  maxHealth: number;
  width: number;
  height: number;
  color: string;
  shield: boolean;
  lastShieldTime: number;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  type: 'wall' | 'barrier' | 'pillar';
}

interface Cannon {
  x: number;
  y: number;
  angle: number;
  power: number;
  cooldown: number;
}

export default function TennisBallGun() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  
  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [playerScore, setPlayerScore] = useState(0);
  const [gladiatorScore, setGladiatorScore] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  const [wave, setWave] = useState(1);
  
  // Game entities
  const [cannon, setCannon] = useState<Cannon>({
    x: 400,
    y: 550,
    angle: -Math.PI / 2, // Pointing up
    power: 15,
    cooldown: 0
  });
  
  const [tennisBalls, setTennisBalls] = useState<TennisBall[]>([]);
  const [gladiators, setGladiators] = useState<Gladiator[]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [mousePos, setMousePos] = useState({ x: 400, y: 300 });

  // Initialize obstacles
  useEffect(() => {
    const newObstacles: Obstacle[] = [
      // Top barriers
      { x: 100, y: 100, width: 80, height: 60, health: 100, maxHealth: 100, type: 'wall' },
      { x: 620, y: 100, width: 80, height: 60, health: 100, maxHealth: 100, type: 'wall' },
      
      // Middle barriers
      { x: 200, y: 250, width: 60, height: 40, health: 80, maxHealth: 80, type: 'barrier' },
      { x: 540, y: 250, width: 60, height: 40, health: 80, maxHealth: 80, type: 'barrier' },
      
      // Side pillars
      { x: 50, y: 200, width: 30, height: 150, health: 120, maxHealth: 120, type: 'pillar' },
      { x: 720, y: 200, width: 30, height: 150, health: 120, maxHealth: 120, type: 'pillar' },
      
      // Center cover
      { x: 350, y: 180, width: 100, height: 50, health: 150, maxHealth: 150, type: 'wall' }
    ];
    setObstacles(newObstacles);
  }, []);

  // Spawn gladiators
  const spawnGladiator = useCallback(() => {
    const gladiatorTypes = [
      { color: '#ff4444', health: 60, speed: 1.2, shield: false },
      { color: '#4444ff', health: 100, speed: 0.8, shield: true },
      { color: '#44ff44', health: 40, speed: 2.0, shield: false },
      { color: '#ffff44', health: 80, speed: 1.5, shield: true }
    ];
    
    const type = gladiatorTypes[Math.floor(Math.random() * gladiatorTypes.length)];
    const spawnX = Math.random() * 700 + 50;
    
    const newGladiator: Gladiator = {
      id: Date.now() + Math.random(),
      x: spawnX,
      y: -30,
      vx: (Math.random() - 0.5) * 0.5,
      vy: type.speed,
      health: type.health,
      maxHealth: type.health,
      width: 30,
      height: 40,
      color: type.color,
      shield: type.shield,
      lastShieldTime: 0
    };
    
    setGladiators(prev => [...prev, newGladiator]);
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => new Set(prev).add(e.key.toLowerCase()));
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => {
        const newKeys = new Set(prev);
        newKeys.delete(e.key.toLowerCase());
        return newKeys;
      });
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle mouse movement and clicks
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    };
    
    const handleClick = (e: MouseEvent) => {
      if (!gameStarted) return;
      
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      fireTennisBall(mouseX, mouseY);
    };
    
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [gameStarted, cannon]);

  // Fire tennis ball
  const fireTennisBall = (targetX: number, targetY: number) => {
    if (cannon.cooldown > 0) return;
    
    const dx = targetX - cannon.x;
    const dy = targetY - cannon.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const speed = cannon.power;
    const vx = (dx / distance) * speed;
    const vy = (dy / distance) * speed;
    
    const newBall: TennisBall = {
      id: Date.now() + Math.random(),
      x: cannon.x,
      y: cannon.y - 20,
      vx,
      vy,
      active: true
    };
    
    setTennisBalls(prev => [...prev, newBall]);
    setCannon(prev => ({ ...prev, cooldown: 15 })); // 15 frame cooldown
  };

  // Game loop
  useEffect(() => {
    if (!gameStarted) return;
    
    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;
      
      // Update game time
      setGameTime(prev => prev + deltaTime);
      
      // Spawn gladiators based on wave
      if (Math.random() < 0.005 + wave * 0.002) {
        spawnGladiator();
      }
      
      // Update cannon
      setCannon(prev => ({
        ...prev,
        angle: Math.atan2(mousePos.y - prev.y, mousePos.x - prev.x),
        cooldown: Math.max(0, prev.cooldown - 1)
      }));
      
      // Move cannon with arrow keys
      setCannon(prev => {
        let newX = prev.x;
        if (keys.has('arrowleft') || keys.has('a')) newX -= 3;
        if (keys.has('arrowright') || keys.has('d')) newX += 3;
        return { ...prev, x: Math.max(30, Math.min(770, newX)) };
      });
      
      // Update tennis balls
      setTennisBalls(prev => prev.map(ball => ({
        ...ball,
        x: ball.x + ball.vx,
        y: ball.y + ball.vy
      })).filter(ball => 
        ball.x > -20 && ball.x < 820 && 
        ball.y > -20 && ball.y < 620 && 
        ball.active
      ));
      
      // Update gladiators
      setGladiators(prev => {
        const updated = prev.map(gladiator => {
          let newX = gladiator.x + gladiator.vx;
          let newY = gladiator.y + gladiator.vy;
          
          // Simple AI - move towards bottom while avoiding obstacles
          const toBottomY = 600 - gladiator.y;
          if (toBottomY > 0) {
            gladiator.vy = Math.min(2, gladiator.vy + 0.02);
          }
          
          // Bounce off screen edges
          if (newX < 0 || newX > 800 - gladiator.width) {
            gladiator.vx *= -1;
            newX = Math.max(0, Math.min(800 - gladiator.width, newX));
          }
          
          return {
            ...gladiator,
            x: newX,
            y: newY
          };
        }).filter(gladiator => {
          // Remove gladiators that reached bottom (they score)
          if (gladiator.y > 600) {
            setGladiatorScore(prev => prev + 1);
            return false;
          }
          // Remove dead gladiators
          return gladiator.health > 0;
        });
        
        return updated;
      });
      
      // Collision detection - tennis balls vs gladiators
      setTennisBalls(prev => {
        const remainingBalls = [...prev];
        
        setGladiators(prevGladiators => {
          return prevGladiators.map(gladiator => {
            for (let i = remainingBalls.length - 1; i >= 0; i--) {
              const ball = remainingBalls[i];
              if (!ball.active) continue;
              
              const dx = ball.x - (gladiator.x + gladiator.width / 2);
              const dy = ball.y - (gladiator.y + gladiator.height / 2);
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < 25) { // Collision detected
                // Remove ball
                remainingBalls[i] = { ...ball, active: false };
                
                // Damage gladiator (unless shielded)
                const currentTime = Date.now();
                if (gladiator.shield && currentTime - gladiator.lastShieldTime > 3000) {
                  // Shield absorbs hit, but has cooldown
                  return { ...gladiator, lastShieldTime: currentTime };
                } else {
                  const newHealth = gladiator.health - 30;
                  if (newHealth <= 0) {
                    setPlayerScore(prevScore => prevScore + 1);
                  }
                  return { ...gladiator, health: newHealth };
                }
              }
            }
            return gladiator;
          });
        });
        
        return remainingBalls.filter(ball => ball.active);
      });
      
      // Collision detection - tennis balls vs obstacles
      setTennisBalls(prev => {
        return prev.map(ball => {
          for (const obstacle of obstacles) {
            if (ball.x > obstacle.x && ball.x < obstacle.x + obstacle.width &&
                ball.y > obstacle.y && ball.y < obstacle.y + obstacle.height) {
              return { ...ball, active: false };
            }
          }
          return ball;
        }).filter(ball => ball.active);
      });
      
      // Update wave
      if (gameTime > wave * 30000) { // New wave every 30 seconds
        setWave(prev => prev + 1);
      }
      
      animationRef.current = requestAnimationFrame(gameLoop);
    };
    
    animationRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameStarted, keys, mousePos, obstacles, wave, gameTime, spawnGladiator]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#2a5934'; // Tennis court green
    ctx.fillRect(0, 0, 800, 600);
    
    // Draw court lines
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Center line
    ctx.moveTo(0, 300);
    ctx.lineTo(800, 300);
    // Side lines
    ctx.moveTo(50, 0);
    ctx.lineTo(50, 600);
    ctx.moveTo(750, 0);
    ctx.lineTo(750, 600);
    ctx.stroke();
    
    // Draw obstacles
    obstacles.forEach(obstacle => {
      const healthPercent = obstacle.health / obstacle.maxHealth;
      ctx.fillStyle = `rgb(${255 - healthPercent * 100}, ${100 + healthPercent * 155}, 100)`;
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      
      // Obstacle border
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
    
    // Draw gladiators
    gladiators.forEach(gladiator => {
      // Body
      ctx.fillStyle = gladiator.color;
      ctx.fillRect(gladiator.x, gladiator.y, gladiator.width, gladiator.height);
      
      // Health bar
      const healthPercent = gladiator.health / gladiator.maxHealth;
      ctx.fillStyle = 'red';
      ctx.fillRect(gladiator.x, gladiator.y - 8, gladiator.width, 4);
      ctx.fillStyle = 'green';
      ctx.fillRect(gladiator.x, gladiator.y - 8, gladiator.width * healthPercent, 4);
      
      // Shield indicator
      if (gladiator.shield) {
        const currentTime = Date.now();
        const shieldActive = currentTime - gladiator.lastShieldTime > 3000;
        if (shieldActive) {
          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(gladiator.x + gladiator.width/2, gladiator.y + gladiator.height/2, 25, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      
      // Gladiator face/helmet
      ctx.fillStyle = '#333';
      ctx.fillRect(gladiator.x + 5, gladiator.y + 5, gladiator.width - 10, 15);
    });
    
    // Draw tennis balls
    tennisBalls.forEach(ball => {
      if (!ball.active) return;
      
      // Draw tennis ball (simplified as yellow circle with lines)
      ctx.fillStyle = '#e6ff00';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Tennis ball lines
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 8, 0, Math.PI * 2);
      ctx.moveTo(ball.x - 8, ball.y);
      ctx.lineTo(ball.x + 8, ball.y);
      ctx.moveTo(ball.x, ball.y - 8);
      ctx.quadraticCurveTo(ball.x + 4, ball.y, ball.x, ball.y + 8);
      ctx.moveTo(ball.x, ball.y - 8);
      ctx.quadraticCurveTo(ball.x - 4, ball.y, ball.x, ball.y + 8);
      ctx.stroke();
    });
    
    // Draw cannon
    ctx.save();
    ctx.translate(cannon.x, cannon.y);
    ctx.rotate(cannon.angle);
    
    // Cannon barrel
    ctx.fillStyle = '#666';
    ctx.fillRect(-5, -30, 10, 30);
    
    // Cannon base
    ctx.restore();
    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.arc(cannon.x, cannon.y, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Crosshair
    ctx.strokeStyle = cannon.cooldown > 0 ? '#ff6666' : '#66ff66';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mousePos.x - 10, mousePos.y);
    ctx.lineTo(mousePos.x + 10, mousePos.y);
    ctx.moveTo(mousePos.x, mousePos.y - 10);
    ctx.lineTo(mousePos.x, mousePos.y + 10);
    ctx.stroke();
    
  }, [cannon, tennisBalls, gladiators, obstacles, mousePos]);

  const startGame = () => {
    setGameStarted(true);
    setPlayerScore(0);
    setGladiatorScore(0);
    setGameTime(0);
    setWave(1);
    setTennisBalls([]);
    setGladiators([]);
    lastTimeRef.current = performance.now();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-800 via-green-700 to-green-900 text-white">
      {/* Home Link */}
      <div className="fixed top-4 left-4 z-50">
        <Link href="/">
          <button className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold px-4 py-2 rounded-full border-2 border-yellow-700 transition-colors">
            ← HOME
          </button>
        </Link>
      </div>

      {/* Page Header */}
      <div className="text-center pt-16 pb-4">
        <h1 className="text-4xl md:text-6xl font-bold text-yellow-400 mb-2">TENNIS BALL GUN</h1>
        <p className="text-xl text-yellow-200">Defend against American Gladiators!</p>
      </div>

      {/* Score Display */}
      <div className="flex justify-center gap-8 mb-4">
        <div className="bg-blue-600 px-4 py-2 rounded-lg">
          <span className="font-bold">YOUR SCORE: {playerScore}</span>
        </div>
        <div className="bg-red-600 px-4 py-2 rounded-lg">
          <span className="font-bold">GLADIATOR SCORE: {gladiatorScore}</span>
        </div>
        <div className="bg-purple-600 px-4 py-2 rounded-lg">
          <span className="font-bold">WAVE: {wave}</span>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="flex justify-center">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="border-4 border-yellow-400 bg-green-600 cursor-crosshair"
          />
          
          {!gameStarted && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-4">AMERICAN GLADIATORS DEFENSE</h2>
                <p className="text-lg mb-6">
                  Stop the gladiators from reaching the bottom!<br/>
                  Click to shoot tennis balls • Use A/D or arrow keys to move
                </p>
                <button
                  onClick={startGame}
                  className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold px-8 py-4 rounded-lg text-xl"
                >
                  START GAME
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-black bg-opacity-50 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">How to Play</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-bold text-yellow-300 mb-2">Controls:</h4>
              <ul className="space-y-1">
                <li>🖱️ <strong>Mouse:</strong> Aim and click to shoot tennis balls</li>
                <li>⌨️ <strong>A/D or Arrow Keys:</strong> Move your cannon left/right</li>
                <li>🎯 <strong>Green crosshair:</strong> Ready to fire</li>
                <li>🔴 <strong>Red crosshair:</strong> Reloading</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-yellow-300 mb-2">Game Rules:</h4>
              <ul className="space-y-1">
                <li>🏆 <strong>Your Goal:</strong> Hit gladiators before they reach the bottom</li>
                <li>⚡ <strong>Gladiator Types:</strong> Red (fast), Blue (shielded), Green (speedy), Yellow (tough)</li>
                <li>🛡️ <strong>Shields:</strong> Blue gladiators have shields with cooldowns</li>
                <li>📈 <strong>Waves:</strong> More gladiators spawn as waves progress</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}