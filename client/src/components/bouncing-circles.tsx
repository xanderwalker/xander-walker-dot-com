import { useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useBouncingAnimation } from '@/hooks/use-bouncing-animation';

export default function BouncingCircles() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  useBouncingAnimation(containerRef);

  const handleNavigation = (path: string, isExternal = false) => {
    console.log('Navigation clicked:', path);
    if (isExternal) {
      window.open(path, '_blank', 'noopener noreferrer');
    } else {
      setLocation(path);
    }
  };

  return (
    <div ref={containerRef} className="fixed inset-0 z-10">
      <div 
        className="bouncing-circle w-80 h-80 bg-electric-orange rounded-full cursor-pointer flex items-center justify-center text-white font-xanman-wide hover:scale-110 transition-transform uppercase" 
        style={{fontSize: '125px', pointerEvents: 'auto'}}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleNavigation('/about');
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleNavigation('/about');
        }}
      >
        BIO
      </div>
      
      <div 
        className="bouncing-circle w-60 h-60 bg-cyan-blue rounded-full cursor-pointer flex items-center justify-center text-white font-xanman-wide hover:scale-110 transition-transform uppercase" 
        style={{fontSize: '125px', pointerEvents: 'auto'}}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleNavigation('https://linkedin.com', true);
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleNavigation('https://linkedin.com', true);
        }}
      >
        LINKEDIN
      </div>
      
      <div 
        className="bouncing-circle bg-electric-red rounded-full cursor-pointer flex items-center justify-center text-white font-xanman-wide hover:scale-110 transition-transform uppercase" 
        style={{width: '280px', height: '280px', fontSize: '125px', pointerEvents: 'auto'}}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleNavigation('/portfolio');
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleNavigation('/portfolio');
        }}
      >
        STORE
      </div>
      
      <div 
        className="bouncing-circle bg-neon-green rounded-full cursor-pointer flex items-center justify-center text-white font-xanman-wide hover:scale-110 transition-transform uppercase" 
        style={{width: '200px', height: '200px', fontSize: '125px', pointerEvents: 'auto'}}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleNavigation('/contact');
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleNavigation('/contact');
        }}
      >
        CONTACT
      </div>
    </div>
  );
}
