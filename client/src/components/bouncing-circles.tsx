import { useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { useBouncingAnimation } from '@/hooks/use-bouncing-animation';

export default function BouncingCircles() {
  const containerRef = useRef<HTMLDivElement>(null);
  useBouncingAnimation(containerRef);

  return (
    <div ref={containerRef} className="fixed inset-0 z-10">
      <Link href="/about">
        <div className="bouncing-circle w-16 h-16 bg-electric-orange rounded-full cursor-pointer flex items-center justify-center text-white font-xanman-wide text-xs hover:scale-110 transition-transform pointer-events-auto">
          Bio
        </div>
      </Link>
      
      <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
        <div className="bouncing-circle w-12 h-12 bg-cyan-blue rounded-full cursor-pointer flex items-center justify-center text-white font-xanman-wide text-xs hover:scale-110 transition-transform pointer-events-auto">
          💼
        </div>
      </a>
      
      <Link href="/portfolio">
        <div className="bouncing-circle w-14 h-14 bg-electric-red rounded-full cursor-pointer flex items-center justify-center text-white font-xanman-wide text-xs hover:scale-110 transition-transform pointer-events-auto">
          Store
        </div>
      </Link>
      
      <Link href="/contact">
        <div className="bouncing-circle w-10 h-10 bg-neon-green rounded-full cursor-pointer flex items-center justify-center text-white font-xanman-wide text-xs hover:scale-110 transition-transform pointer-events-auto">
          📫
        </div>
      </Link>
    </div>
  );
}
