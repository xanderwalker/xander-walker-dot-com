import { useState, useRef, useEffect } from 'react';
import Layout from '@/components/layout';

interface SlotSymbol {
  emoji: string;
  name: string;
  value: number;
}

interface FallingCoin {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
}

const SLOT_SYMBOLS: SlotSymbol[] = [
  { emoji: '🍒', name: 'Cherry', value: 2 },
  { emoji: '🍋', name: 'Lemon', value: 3 },
  { emoji: '🍊', name: 'Orange', value: 4 },
  { emoji: '🍇', name: 'Grapes', value: 5 },
  { emoji: '🔔', name: 'Bell', value: 10 },
  { emoji: '⭐', name: 'Star', value: 15 },
  { emoji: '💎', name: 'Diamond', value: 25 },
  { emoji: '🍀', name: 'Lucky Clover', value: 30 },
  { emoji: '💰', name: 'Money Bag', value: 50 },
  { emoji: '🎰', name: 'Jackpot', value: 100 }
];

export default function SlotMachine() {
  const [reels, setReels] = useState<number[][]>([
    Array(10).fill(0).map((_, i) => i),
    Array(10).fill(0).map((_, i) => i),
    Array(10).fill(0).map((_, i) => i)
  ]);
  const [currentResults, setCurrentResults] = useState<number[]>([0, 1, 2]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [credits, setCredits] = useState(100);
  const [lastWin, setLastWin] = useState(0);
  const [handlePulled, setHandlePulled] = useState(false);
  const [fallingCoins, setFallingCoins] = useState<FallingCoin[]>([]);
  const [spinSounds] = useState(() => {
    // Create audio context for sound effects
    if (typeof window !== 'undefined') {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        return { audioContext };
      } catch {
        return null;
      }
    }
    return null;
  });

  const coinsAnimationRef = useRef<number>();

  // Animate falling coins
  useEffect(() => {
    if (fallingCoins.length === 0) return;

    const animate = () => {
      setFallingCoins(prev => 
        prev.map(coin => ({
          ...coin,
          x: coin.x + coin.vx,
          y: coin.y + coin.vy,
          vy: coin.vy + 0.5, // Gravity
          rotation: coin.rotation + coin.rotationSpeed
        })).filter(coin => coin.y < window.innerHeight + 50) // Remove coins that fall off screen
      );
      
      if (fallingCoins.length > 0) {
        coinsAnimationRef.current = requestAnimationFrame(animate);
      }
    };

    coinsAnimationRef.current = requestAnimationFrame(animate);

    return () => {
      if (coinsAnimationRef.current) {
        cancelAnimationFrame(coinsAnimationRef.current);
      }
    };
  }, [fallingCoins.length]);

  const playSound = (frequency: number, duration: number) => {
    if (!spinSounds?.audioContext) return;
    
    const oscillator = spinSounds.audioContext.createOscillator();
    const gainNode = spinSounds.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(spinSounds.audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.1, spinSounds.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, spinSounds.audioContext.currentTime + duration);
    
    oscillator.start();
    oscillator.stop(spinSounds.audioContext.currentTime + duration);
  };

  const generateCoins = (amount: number) => {
    const newCoins: FallingCoin[] = [];
    const machineBottom = 600; // Approximate bottom of slot machine
    
    for (let i = 0; i < Math.min(amount, 20); i++) { // Cap at 20 coins for performance
      newCoins.push({
        id: Date.now() + i,
        x: 300 + Math.random() * 200, // Coins fall from machine area
        y: machineBottom,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 5 - 3,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 20
      });
    }
    
    setFallingCoins(prev => [...prev, ...newCoins]);
  };

  const calculateWin = (results: number[]) => {
    const symbols = results.map(i => SLOT_SYMBOLS[i]);
    
    // Check for three of a kind
    if (symbols[0].name === symbols[1].name && symbols[1].name === symbols[2].name) {
      return symbols[0].value * 10; // Big multiplier for three of a kind
    }
    
    // Check for two of a kind
    const counts = symbols.reduce((acc, symbol) => {
      acc[symbol.name] = (acc[symbol.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const pairs = Object.entries(counts).filter(([_, count]) => count === 2);
    if (pairs.length > 0) {
      const pairSymbol = SLOT_SYMBOLS.find(s => s.name === pairs[0][0]);
      return pairSymbol ? pairSymbol.value * 2 : 0;
    }
    
    // Check for any cherries (small consolation prize)
    const cherryCount = symbols.filter(s => s.name === 'Cherry').length;
    if (cherryCount > 0) {
      return cherryCount;
    }
    
    return 0;
  };

  const pullHandle = async () => {
    if (isSpinning || credits < 1) return;
    
    setHandlePulled(true);
    setCredits(prev => prev - 1);
    setIsSpinning(true);
    setLastWin(0);
    
    // Handle animation
    setTimeout(() => setHandlePulled(false), 300);
    
    // Play spinning sound
    playSound(200, 0.1);
    
    // Generate random results for each reel
    const spinDurations = [1000, 1500, 2000]; // Different spin times for each reel
    const finalResults: number[] = [];
    
    // Spin each reel with different timing
    spinDurations.forEach((duration, reelIndex) => {
      setTimeout(() => {
        const result = Math.floor(Math.random() * SLOT_SYMBOLS.length);
        finalResults[reelIndex] = result;
        
        // Update the reel display
        setReels(prev => {
          const newReels = [...prev];
          // Shuffle the reel and put result in visible position
          newReels[reelIndex] = Array(10).fill(0).map(() => Math.floor(Math.random() * SLOT_SYMBOLS.length));
          newReels[reelIndex][4] = result; // Middle position is the result
          return newReels;
        });
        
        // Play stop sound
        playSound(150, 0.2);
        
        // Check if all reels are done
        if (finalResults.filter(r => r !== undefined).length === 3) {
          setTimeout(() => {
            setCurrentResults(finalResults);
            const winAmount = calculateWin(finalResults);
            setLastWin(winAmount);
            
            if (winAmount > 0) {
              setCredits(prev => prev + winAmount);
              generateCoins(winAmount);
              // Play win sound
              playSound(400, 0.5);
            }
            
            setIsSpinning(false);
          }, 500);
        }
      }, duration);
    });
  };

  return (
    <Layout title="SLOT MACHINE" subtitle="Pull the handle and test your luck">
      <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-800 to-red-900 text-white p-4">
        <div className="max-w-4xl mx-auto">
          
          {/* Slot Machine Frame */}
          <div className="relative mx-auto w-fit">
            {/* Main Machine Body */}
            <div className="bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600 p-8 rounded-lg shadow-2xl border-8 border-yellow-700 relative">
              {/* Top Decorative Elements */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-yellow-200 px-6 py-2 rounded-full font-bold text-xl border-4 border-yellow-700">
                🎰 LUCKY SLOTS 🎰
              </div>
              
              {/* Credits Display */}
              <div className="bg-black text-green-400 p-4 rounded-lg mb-6 text-center font-mono text-2xl border-4 border-gray-600">
                CREDITS: {credits} | LAST WIN: {lastWin}
              </div>
              
              {/* Slot Reels */}
              <div className="flex gap-4 mb-6 justify-center">
                {reels.map((reel, reelIndex) => (
                  <div key={reelIndex} className="bg-white border-4 border-gray-800 rounded-lg overflow-hidden w-24 h-32 relative">
                    {/* Reel Background */}
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-100 to-gray-200"></div>
                    
                    {/* Spinning Reel Animation */}
                    <div 
                      className={`absolute inset-0 flex flex-col items-center transition-transform duration-200 ${
                        isSpinning ? 'animate-spin' : ''
                      }`}
                      style={{
                        transform: isSpinning ? 'translateY(-200px)' : 'translateY(-96px)'
                      }}
                    >
                      {reel.map((symbolIndex, position) => (
                        <div 
                          key={position}
                          className="w-full h-8 flex items-center justify-center text-2xl bg-white border-b border-gray-300"
                        >
                          {SLOT_SYMBOLS[symbolIndex]?.emoji}
                        </div>
                      ))}
                    </div>
                    
                    {/* Result Highlight */}
                    {!isSpinning && (
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/2 left-0 right-0 h-8 -translate-y-1/2 bg-yellow-300 bg-opacity-50 border-2 border-yellow-500"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Result Display */}
              {!isSpinning && (
                <div className="text-center mb-6">
                  <div className="text-3xl mb-2">
                    {currentResults.map((result, index) => (
                      <span key={index} className="mx-2">
                        {SLOT_SYMBOLS[result]?.emoji}
                      </span>
                    ))}
                  </div>
                  {lastWin > 0 && (
                    <div className="text-2xl font-bold text-yellow-200 animate-pulse">
                      🎉 YOU WIN {lastWin} CREDITS! 🎉
                    </div>
                  )}
                </div>
              )}
              
              {/* Coin Slot and Payout Tray */}
              <div className="flex justify-between items-end">
                <div className="text-center">
                  <div className="bg-black w-8 h-2 rounded-full mb-2"></div>
                  <div className="text-sm text-black font-bold">INSERT COIN</div>
                </div>
                
                <div className="bg-gradient-to-b from-gray-400 to-gray-600 w-32 h-8 rounded-lg border-2 border-gray-700 relative overflow-hidden">
                  <div className="absolute inset-1 bg-gradient-to-b from-gray-300 to-gray-500 rounded"></div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-xs text-black font-bold">
                    PAYOUT
                  </div>
                </div>
              </div>
            </div>
            
            {/* Side Handle */}
            <div className="absolute -right-12 top-1/2 transform -translate-y-1/2">
              <button
                onClick={pullHandle}
                disabled={isSpinning || credits < 1}
                className={`bg-gradient-to-b from-red-500 to-red-700 w-8 h-32 rounded-full border-4 border-red-800 shadow-lg transition-all duration-300 ${
                  handlePulled ? 'translate-y-4' : 'hover:translate-y-1'
                } ${
                  isSpinning || credits < 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-xl'
                }`}
              >
                <div className="bg-gradient-to-b from-red-400 to-red-600 w-4 h-24 rounded-full mx-auto mt-1 border-2 border-red-700"></div>
              </button>
              <div className="text-center mt-2 text-sm font-bold text-yellow-200">
                PULL
              </div>
            </div>
          </div>
          
          {/* Paytable */}
          <div className="mt-8 bg-black bg-opacity-50 p-6 rounded-lg border-2 border-yellow-600">
            <h3 className="text-xl font-bold text-yellow-400 mb-4 text-center">PAYTABLE</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-bold text-yellow-300 mb-2">THREE OF A KIND:</div>
                {SLOT_SYMBOLS.slice(0, 5).map(symbol => (
                  <div key={symbol.name} className="flex justify-between">
                    <span>{symbol.emoji} {symbol.emoji} {symbol.emoji}</span>
                    <span>{symbol.value * 10} credits</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="font-bold text-yellow-300 mb-2">TWO OF A KIND:</div>
                {SLOT_SYMBOLS.slice(5).map(symbol => (
                  <div key={symbol.name} className="flex justify-between">
                    <span>{symbol.emoji} {symbol.emoji} ❓</span>
                    <span>{symbol.value * 2} credits</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 text-center text-yellow-300">
              🍒 Any Cherry = 1 credit per cherry
            </div>
          </div>
          
          {/* Falling Coins */}
          {fallingCoins.map(coin => (
            <div
              key={coin.id}
              className="fixed w-6 h-6 text-2xl pointer-events-none z-50"
              style={{
                left: coin.x,
                top: coin.y,
                transform: `rotate(${coin.rotation}deg)`
              }}
            >
              🪙
            </div>
          ))}
          
          {/* Instructions */}
          <div className="mt-6 text-center text-yellow-200">
            <p className="mb-2">Pull the handle to spin! Each spin costs 1 credit.</p>
            <p className="text-sm opacity-75">Match symbols to win credits. Three of a kind pays the most!</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}