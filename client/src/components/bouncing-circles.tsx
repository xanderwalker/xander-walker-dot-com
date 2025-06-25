import { useRef, useEffect } from 'react';
import { useBouncingAnimation } from '@/hooks/use-bouncing-animation';

export default function BouncingCircles() {
  const containerRef = useRef<HTMLDivElement>(null);
  useBouncingAnimation(containerRef);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-10">
      <div className="bouncing-circle w-16 h-16 bg-electric-orange rounded-full" />
      <div className="bouncing-circle w-12 h-12 bg-cyan-blue rounded-full" />
      <div className="bouncing-circle w-14 h-14 bg-electric-red rounded-full" />
      <div className="bouncing-circle w-10 h-10 bg-neon-green rounded-full" />
    </div>
  );
}
