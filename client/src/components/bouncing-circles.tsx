import { useRef, useEffect, useState } from 'react';
import { useLocation } from 'wouter';

interface Circle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  text: string;
  action: () => void;
}

export default function BouncingCircles() {
  const [, setLocation] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [circles, setCircles] = useState<Circle[]>([]);
  const animationRef = useRef<number>();

  const navigateToPage = (path: string) => {
    console.log('Navigating to:', path);
    setLocation(path);
  };

  const openExternal = (url: string) => {
    console.log('Opening external:', url);
    window.open(url, '_blank', 'noopener noreferrer');
  };

  useEffect(() => {
    // Start with static positions to test clicking
    const initialCircles: Circle[] = [
      {
        id: 'bio',
        x: 100,
        y: 100,
        vx: 0,
        vy: 0,
        size: 320,
        color: 'bg-electric-orange',
        text: 'BIO',
        action: () => navigateToPage('/about')
      },
      {
        id: 'linkedin',
        x: 500,
        y: 200,
        vx: 0,
        vy: 0,
        size: 240,
        color: 'bg-cyan-blue',
        text: 'LINKEDIN',
        action: () => openExternal('https://linkedin.com')
      },
      {
        id: 'store',
        x: 200,
        y: 400,
        vx: 0,
        vy: 0,
        size: 280,
        color: 'bg-electric-red',
        text: 'STORE',
        action: () => navigateToPage('/portfolio')
      },
      {
        id: 'contact',
        x: 600,
        y: 500,
        vx: 0,
        vy: 0,
        size: 200,
        color: 'bg-neon-green',
        text: 'CONTACT',
        action: () => navigateToPage('/contact')
      }
    ];

    setCircles(initialCircles);
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 z-50">
      {circles.map(circle => (
        <button
          key={circle.id}
          className={`absolute ${circle.color} rounded-full cursor-pointer flex items-center justify-center text-white font-xanman-wide hover:scale-110 transition-transform duration-200 uppercase border-0 outline-none`}
          style={{
            left: circle.x,
            top: circle.y,
            width: circle.size,
            height: circle.size,
            fontSize: window.innerWidth < 768 ? '50px' : '80px',
            lineHeight: '1'
          }}
          onClick={() => {
            console.log('Button clicked:', circle.id);
            circle.action();
          }}
          type="button"
        >
          {circle.text}
        </button>
      ))}
    </div>
  );
}