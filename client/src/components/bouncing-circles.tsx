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
    const initialCircles: Circle[] = [
      {
        id: 'bio',
        x: Math.random() * (window.innerWidth - 320),
        y: Math.random() * (window.innerHeight - 320),
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: 320,
        color: 'bg-electric-orange',
        text: 'BIO',
        action: () => navigateToPage('/about')
      },
      {
        id: 'linkedin',
        x: Math.random() * (window.innerWidth - 240),
        y: Math.random() * (window.innerHeight - 240),
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: 240,
        color: 'bg-cyan-blue',
        text: 'LINKEDIN',
        action: () => openExternal('https://linkedin.com')
      },
      {
        id: 'store',
        x: Math.random() * (window.innerWidth - 280),
        y: Math.random() * (window.innerHeight - 280),
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: 280,
        color: 'bg-electric-red',
        text: 'STORE',
        action: () => navigateToPage('/portfolio')
      },
      {
        id: 'contact',
        x: Math.random() * (window.innerWidth - 200),
        y: Math.random() * (window.innerHeight - 200),
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: 200,
        color: 'bg-neon-green',
        text: 'CONTACT',
        action: () => navigateToPage('/contact')
      }
    ];

    setCircles(initialCircles);

    const animate = () => {
      setCircles(prevCircles => 
        prevCircles.map(circle => {
          let newX = circle.x + circle.vx;
          let newY = circle.y + circle.vy;
          let newVx = circle.vx;
          let newVy = circle.vy;

          // Bounce off edges
          if (newX <= 0 || newX >= window.innerWidth - circle.size) {
            newVx = -newVx;
            newX = Math.max(0, Math.min(window.innerWidth - circle.size, newX));
          }
          if (newY <= 0 || newY >= window.innerHeight - circle.size) {
            newVy = -newVy;
            newY = Math.max(0, Math.min(window.innerHeight - circle.size, newY));
          }

          return {
            ...circle,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy
          };
        })
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 z-30">
      {circles.map(circle => (
        <button
          key={circle.id}
          className={`absolute ${circle.color} rounded-full cursor-pointer flex items-center justify-center text-white font-xanman-wide hover:scale-110 transition-transform duration-200 uppercase border-0 outline-none opacity-70`}
          style={{
            left: circle.x,
            top: circle.y,
            width: circle.size,
            height: circle.size,
            fontSize: window.innerWidth < 768 ? '100px' : '80px',
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