import { useRef, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { trackEvent } from '../lib/analytics';

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
  // Enhanced bubble deformation properties
  scaleX: number;
  scaleY: number;
  bounceStartTime: number;
  bounceCount: number;
  isReververating: boolean;
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
    trackEvent('navigation', 'bouncing_circle', path);
    setLocation(path);
  };

  const openExternal = (url: string) => {
    console.log('Opening external:', url);
    window.open(url, '_blank', 'noopener noreferrer');
  };

  useEffect(() => {
    // Detect mobile for performance optimization
    const isMobile = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    const initialCircles: Circle[] = [
      {
        id: 'bio',
        x: Math.random() * (window.innerWidth - 320),
        y: Math.random() * (window.innerHeight - 320),
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: 320,
        color: 'bg-electric-orange',
        text: 'RESUME',
        action: () => navigateToPage('/about'),
        scaleX: 1,
        scaleY: 1,
        bounceStartTime: 0,
        bounceCount: 0,
        isReververating: false
      },
      {
        id: 'projects',
        x: Math.random() * (window.innerWidth - 240),
        y: Math.random() * (window.innerHeight - 240),
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: 240,
        color: 'bg-cyan-blue',
        text: 'PROJECTS',
        action: () => navigateToPage('/projects'),
        scaleX: 1,
        scaleY: 1,
        bounceStartTime: 0,
        bounceCount: 0,
        isReververating: false
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
        action: () => navigateToPage('/portfolio'),
        scaleX: 1,
        scaleY: 1,
        bounceStartTime: 0,
        bounceCount: 0,
        isReververating: false
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
        action: () => navigateToPage('/contact'),
        scaleX: 1,
        scaleY: 1,
        bounceStartTime: 0,
        bounceCount: 0,
        isReververating: false
      }
    ];

    setCircles(initialCircles);

    // Performance optimization for mobile
    let frameCount = 0;
    const mobileFrameSkip = 2; // Skip every 2nd frame on mobile for 30fps instead of 60fps

    const animate = () => {
      frameCount++;
      
      // Skip frames on mobile for better performance
      if (isMobile && frameCount % mobileFrameSkip !== 0) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const currentTime = Date.now();

      setCircles(prevCircles => 
        prevCircles.map(circle => {
          let newX = circle.x + circle.vx;
          let newY = circle.y + circle.vy;
          let newVx = circle.vx;
          let newVy = circle.vy;
          let newScaleX = circle.scaleX;
          let newScaleY = circle.scaleY;
          let newBounceStartTime = circle.bounceStartTime;
          let newBounceCount = circle.bounceCount;
          let newIsReververating = circle.isReververating;
          
          // Check for wall collisions and start soap bubble bounce physics
          let hasCollided = false;
          
          // Check horizontal boundaries
          if (newX <= 0 || newX >= window.innerWidth - circle.size) {
            newVx = -newVx;
            newX = Math.max(0, Math.min(window.innerWidth - circle.size, newX));
            hasCollided = true;
            
            // Initial bubble deformation on collision
            newScaleX = 0.7; // More dramatic squish
            newScaleY = 1.3;
          }
          
          // Check vertical boundaries
          if (newY <= 0 || newY >= window.innerHeight - circle.size) {
            newVy = -newVy;
            newY = Math.max(0, Math.min(window.innerHeight - circle.size, newY));
            hasCollided = true;
            
            // Initial bubble deformation on collision
            newScaleX = 1.3;
            newScaleY = 0.7; // More dramatic squish
          }
          
          // Start reverberation cycle on first collision
          if (hasCollided && !newIsReververating) {
            newBounceStartTime = currentTime;
            newBounceCount = 0;
            newIsReververating = true;
          }
          
          // Handle soap bubble reverberation physics (4 bounces over 4 seconds)
          if (newIsReververating) {
            const timeSinceBounce = currentTime - newBounceStartTime;
            const cycleDuration = 4000; // 4 seconds total
            const cycleProgress = Math.min(timeSinceBounce / cycleDuration, 1);
            
            // Calculate reverberation frequency - 4 reverberations
            const frequency = 4;
            const oscillation = Math.sin(cycleProgress * frequency * Math.PI * 2);
            
            // Exponential decay over 4 seconds
            const decay = Math.exp(-cycleProgress * 3); // Natural exponential decay
            
            // Apply oscillating deformation with decay
            const baseDeformation = 0.3 * decay; // Maximum 30% deformation, decaying
            const deformationAmount = baseDeformation * oscillation;
            
            // Apply the deformation based on collision direction
            if (Math.abs(newScaleX - 1) > Math.abs(newScaleY - 1)) {
              // Horizontal collision - oscillate horizontally
              newScaleX = 1 + deformationAmount;
              newScaleY = 1 - deformationAmount * 0.5; // Counter-deformation
            } else {
              // Vertical collision - oscillate vertically
              newScaleY = 1 + deformationAmount;
              newScaleX = 1 - deformationAmount * 0.5; // Counter-deformation
            }
            
            // End reverberation after 4 seconds
            if (cycleProgress >= 1) {
              newIsReververating = false;
              newScaleX = 1;
              newScaleY = 1;
              newBounceStartTime = 0;
              newBounceCount = 0;
            }
          }

          return {
            ...circle,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            scaleX: newScaleX,
            scaleY: newScaleY,
            bounceStartTime: newBounceStartTime,
            bounceCount: newBounceCount,
            isReververating: newIsReververating
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

  // Global mouse and touch event listeners for dragging (optimized for mobile)
  useEffect(() => {
    const isMobile = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    let lastUpdate = 0;
    const updateInterval = isMobile ? 16 : 8; // 60fps on desktop, 30fps on mobile

    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      if (!draggedCircle) return;
      
      // Throttle updates on mobile for better performance
      const now = Date.now();
      if (isMobile && now - lastUpdate < updateInterval) return;
      lastUpdate = now;
      
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      let clientX, clientY;
      if (e.type === 'touchmove') {
        const touch = (e as TouchEvent).touches[0];
        if (!touch) return;
        clientX = touch.clientX;
        clientY = touch.clientY;
      } else {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }
      
      const posX = clientX - rect.left;
      const posY = clientY - rect.top;
      
      setMousePos({ x: posX, y: posY });
      
      setCircles(prev => prev.map(c => 
        c.id === draggedCircle 
          ? { 
              ...c, 
              x: Math.max(0, Math.min(window.innerWidth - c.size, posX - dragOffset.x)),
              y: Math.max(0, Math.min(window.innerHeight - c.size, posY - dragOffset.y)),
              vx: 0,
              vy: 0,
              scaleX: 1,
              scaleY: 1,
              bounceStartTime: 0,
              bounceCount: 0,
              isReververating: false
            }
          : c
      ));
    };

    const handleGlobalEnd = () => {
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
                isDragging: false,
                scaleX: 1,
                scaleY: 1,
                deformDecay: 0
              }
            : c
        ));
      }
      
      setDraggedCircle(null);
      setCircles(prev => prev.map(c => ({ ...c, isDragging: false })));
    };

    // Add both mouse and touch event listeners
    document.addEventListener('mousemove', handleGlobalMove);
    document.addEventListener('mouseup', handleGlobalEnd);
    document.addEventListener('touchmove', handleGlobalMove, { passive: false });
    document.addEventListener('touchend', handleGlobalEnd);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMove);
      document.removeEventListener('mouseup', handleGlobalEnd);
      document.removeEventListener('touchmove', handleGlobalMove);
      document.removeEventListener('touchend', handleGlobalEnd);
    };
  }, [draggedCircle, dragOffset, mousePos, circles]);

  // Drag functionality for both mouse and touch
  const handleStart = (e: React.MouseEvent | React.TouchEvent, circleId: string) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const circle = circles.find(c => c.id === circleId);
    if (!circle) return;
    
    let clientX, clientY;
    if (e.type === 'touchstart') {
      const touch = (e as React.TouchEvent).touches[0];
      if (!touch) return;
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    const posX = clientX - rect.left;
    const posY = clientY - rect.top;
    
    setDraggedCircle(circleId);
    setDragOffset({
      x: posX - circle.x,
      y: posY - circle.y
    });
    setMousePos({ x: posX, y: posY });
    
    // Mark drag start time and position for click detection
    setCircles(prev => prev.map(c => 
      c.id === circleId 
        ? { 
            ...c, 
            isDragging: true, 
            dragStartX: posX, 
            dragStartY: posY, 
            dragStartTime: Date.now(),
            scaleX: 1,
            scaleY: 1,
            bounceStartTime: 0,
            bounceCount: 0,
            isReververating: false
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
            lineHeight: '1',
            transform: `scaleX(${circle.scaleX}) scaleY(${circle.scaleY})`,
            transformOrigin: 'center center',
            willChange: 'transform, left, top', // Optimize for GPU acceleration
            backfaceVisibility: 'hidden', // Reduce repaints
            WebkitFontSmoothing: 'antialiased' // Better text rendering on mobile
          }}
          onMouseDown={(e) => handleStart(e, circle.id)}
          onTouchStart={(e) => handleStart(e, circle.id)}
          onClick={() => handleClick(circle.id)}
          type="button"
        >
          {circle.text}
        </button>
      ))}
    </div>
  );
}