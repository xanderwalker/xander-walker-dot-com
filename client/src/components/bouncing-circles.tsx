import { useEffect, useRef, useState } from 'react';
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
  isDragging?: boolean;
  dragStartX?: number;
  dragStartY?: number;
  dragStartTime?: number;
}

export default function BouncingCircles() {
  const [, setLocation] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [circles, setCircles] = useState<Circle[]>([]);
  const animationRef = useRef<number>();
  const [draggedCircle, setDraggedCircle] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

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
        x: Math.random() * (window.innerWidth - 200),
        y: Math.random() * (window.innerHeight - 200),
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: 200,
        color: 'bg-electric-orange',
        text: 'BIO',
        action: () => navigateToPage('/about')
      },
      {
        id: 'linkedin',
        x: Math.random() * (window.innerWidth - 200),
        y: Math.random() * (window.innerHeight - 200),
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: 200,
        color: 'bg-electric-cyan',
        text: 'LINKEDIN',
        action: () => openExternal('https://linkedin.com/in/xander-walker')
      },
      {
        id: 'store',
        x: Math.random() * (window.innerWidth - 200),
        y: Math.random() * (window.innerHeight - 200),
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: 200,
        color: 'bg-neon-red',
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
          // Skip physics for dragged circles
          if (circle.isDragging) {
            return circle;
          }

          // Standard bouncing physics
          let newX = circle.x + circle.vx;
          let newY = circle.y + circle.vy;
          let newVx = circle.vx;
          let newVy = circle.vy;

          // Bounce off edges
          if (newX <= 0 || newX >= window.innerWidth - circle.size) {
            newVx = -newVx * 0.8;
            newX = Math.max(0, Math.min(window.innerWidth - circle.size, newX));
          }
          if (newY <= 0 || newY >= window.innerHeight - circle.size) {
            newVy = -newVy * 0.8;
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

  // Global mouse tracking for drag functionality
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      
      if (draggedCircle) {
        setCircles(prev => prev.map(circle => 
          circle.id === draggedCircle 
            ? { 
                ...circle, 
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y,
                isDragging: true 
              }
            : circle
        ));
      }
    };

    const handleGlobalMouseUp = () => {
      if (!draggedCircle) return;
      
      const circle = circles.find(c => c.id === draggedCircle);
      if (!circle) return;
      
      const dragDuration = Date.now() - (circle.dragStartTime || 0);
      const dragDistance = Math.sqrt(
        Math.pow((mousePos.x - (circle.dragStartX || 0)), 2) + 
        Math.pow((mousePos.y - (circle.dragStartY || 0)), 2)
      );
      
      // Apply throw velocity if dragged
      if (dragDuration >= 200 || dragDistance >= 5) {
        const throwMultiplier = 0.1;
        const deltaX = mousePos.x - (circle.dragStartX || 0);
        const deltaY = mousePos.y - (circle.dragStartY || 0);
        
        setCircles(prev => prev.map(c => 
          c.id === draggedCircle 
            ? { 
                ...c, 
                vx: deltaX * throwMultiplier,
                vy: deltaY * throwMultiplier,
                isDragging: false 
              }
            : c
        ));
      }
      
      setDraggedCircle(null);
      setCircles(prev => prev.map(c => ({ ...c, isDragging: false })));
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggedCircle, dragOffset, mousePos, circles]);

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent, circleId: string) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const circle = circles.find(c => c.id === circleId);
    if (!circle) return;
    
    const offsetX = e.clientX - circle.x;
    const offsetY = e.clientY - circle.y;
    
    setDragOffset({ x: offsetX, y: offsetY });
    setDraggedCircle(circleId);
    
    setCircles(prev => prev.map(c => 
      c.id === circleId 
        ? { 
            ...c, 
            isDragging: true,
            dragStartX: e.clientX,
            dragStartY: e.clientY,
            dragStartTime: Date.now()
          }
        : c
    ));
  };

  const handleClick = (circleId: string) => {
    const circle = circles.find(c => c.id === circleId);
    if (!circle || circle.isDragging) return;
    
    const dragDuration = Date.now() - (circle.dragStartTime || 0);
    const dragDistance = Math.sqrt(
      Math.pow((mousePos.x - (circle.dragStartX || 0)), 2) + 
      Math.pow((mousePos.y - (circle.dragStartY || 0)), 2)
    );
    
    // Only trigger action if it was a quick click
    if (dragDuration < 200 && dragDistance < 5) {
      console.log('Button clicked:', circleId);
      circle.action();
    }
  };

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
          onMouseDown={(e) => handleMouseDown(e, circle.id)}
          onClick={() => handleClick(circle.id)}
          type="button"
        >
          {circle.text}
        </button>
      ))}
    </div>
  );
}