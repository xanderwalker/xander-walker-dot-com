import { useEffect, useRef } from 'react';

interface Circle {
  element: HTMLElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

export function useBouncingAnimation(containerRef: React.RefObject<HTMLElement>) {
  const circlesRef = useRef<Circle[]>([]);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const circleElements = container.querySelectorAll('.bouncing-circle') as NodeListOf<HTMLElement>;
    
    // Initialize circles
    circlesRef.current = Array.from(circleElements).map((element) => {
      const size = element.offsetWidth || 60;
      return {
        element,
        x: Math.random() * (window.innerWidth - size),
        y: Math.random() * (window.innerHeight - size),
        vx: (Math.random() - 0.5) * 3, // Random velocity between -1.5 and 1.5
        vy: (Math.random() - 0.5) * 3,
        size
      };
    });

    // Set initial positions
    circlesRef.current.forEach(circle => {
      circle.element.style.left = circle.x + 'px';
      circle.element.style.top = circle.y + 'px';
    });

    // Animation loop
    const animate = () => {
      circlesRef.current.forEach(circle => {
        // Update position
        circle.x += circle.vx;
        circle.y += circle.vy;

        // Bounce off edges
        if (circle.x <= 0 || circle.x >= window.innerWidth - circle.size) {
          circle.vx = -circle.vx;
          circle.x = Math.max(0, Math.min(window.innerWidth - circle.size, circle.x));
        }

        if (circle.y <= 0 || circle.y >= window.innerHeight - circle.size) {
          circle.vy = -circle.vy;
          circle.y = Math.max(0, Math.min(window.innerHeight - circle.size, circle.y));
        }

        // Apply position
        circle.element.style.left = circle.x + 'px';
        circle.element.style.top = circle.y + 'px';
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Handle window resize
    const handleResize = () => {
      circlesRef.current.forEach(circle => {
        circle.x = Math.min(circle.x, window.innerWidth - circle.size);
        circle.y = Math.min(circle.y, window.innerHeight - circle.size);
      });
    };

    window.addEventListener('resize', handleResize);
    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [containerRef]);

  return circlesRef;
}
