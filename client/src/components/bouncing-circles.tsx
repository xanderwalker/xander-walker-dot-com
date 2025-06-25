import { useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { useBouncingAnimation } from '@/hooks/use-bouncing-animation';

export default function BouncingCircles() {
  const containerRef = useRef<HTMLDivElement>(null);
  useBouncingAnimation(containerRef);

  return (
    <div ref={containerRef} className="fixed inset-0 z-10">
      <Link href="/about">
        <div className="bouncing-circle w-80 h-80 bg-electric-orange rounded-full cursor-pointer flex items-center justify-center text-white font-xanman-wide hover:scale-110 transition-transform pointer-events-auto uppercase" style={{fontSize: '200px'}}>
          BIO
        </div>
      </Link>
      
      <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
        <div className="bouncing-circle w-60 h-60 bg-cyan-blue rounded-full cursor-pointer flex items-center justify-center text-white font-xanman-wide hover:scale-110 transition-transform pointer-events-auto uppercase" style={{fontSize: '200px'}}>
          LINKEDIN
        </div>
      </a>
      
      <Link href="/portfolio">
        <div className="bouncing-circle bg-electric-red rounded-full cursor-pointer flex items-center justify-center text-white font-xanman-wide hover:scale-110 transition-transform pointer-events-auto uppercase" style={{width: '280px', height: '280px', fontSize: '200px'}}>
          STORE
        </div>
      </Link>
      
      <Link href="/contact">
        <div className="bouncing-circle bg-neon-green rounded-full cursor-pointer flex items-center justify-center text-white font-xanman-wide hover:scale-110 transition-transform pointer-events-auto uppercase" style={{width: '200px', height: '200px', fontSize: '200px'}}>
          CONTACT
        </div>
      </Link>
    </div>
  );
}
