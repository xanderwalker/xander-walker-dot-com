import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/layout';

export default function Home() {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [accelData, setAccelData] = useState({ x: 0, y: 0 });
  const backgroundRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth > 768) { // Desktop only
        setMousePos({
          x: e.clientX / window.innerWidth,
          y: e.clientY / window.innerHeight
        });
      }
    };

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      if (window.innerWidth <= 768) { // Mobile only
        const acceleration = event.accelerationIncludingGravity;
        if (acceleration) {
          // Normalize values and invert for natural feel
          setAccelData({
            x: Math.max(-1, Math.min(1, (acceleration.x || 0) / 10)),
            y: Math.max(-1, Math.min(1, (acceleration.y || 0) / 10))
          });
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('devicemotion', handleDeviceMotion);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('devicemotion', handleDeviceMotion);
    };
  }, []);

  const dynamicStyle = window.innerWidth > 768 ? {
    // Desktop: mouse-based
    background: `
      radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, 
        rgba(91, 134, 229, 0.3) 0%, 
        rgba(147, 112, 219, 0.2) 25%,
        rgba(72, 61, 139, 0.15) 50%,
        rgba(25, 25, 112, 0.1) 75%,
        rgba(0, 0, 0, 0.05) 100%),
      radial-gradient(circle at ${(1 - mousePos.x) * 100}% ${(1 - mousePos.y) * 100}%, 
        rgba(255, 248, 220, 0.2) 0%,
        rgba(245, 245, 220, 0.15) 30%,
        rgba(230, 230, 250, 0.1) 60%,
        rgba(240, 248, 255, 0.05) 100%),
      linear-gradient(135deg, 
        rgba(123, 104, 238, 0.1) 0%,
        rgba(147, 112, 219, 0.08) 25%,
        rgba(72, 61, 139, 0.06) 50%,
        rgba(25, 25, 112, 0.04) 100%)
    `
  } : {
    // Mobile: accelerometer-based
    background: `
      radial-gradient(circle at ${50 + accelData.x * 30}% ${50 + accelData.y * 30}%, 
        rgba(91, 134, 229, 0.3) 0%, 
        rgba(147, 112, 219, 0.2) 25%,
        rgba(72, 61, 139, 0.15) 50%,
        rgba(25, 25, 112, 0.1) 75%,
        rgba(0, 0, 0, 0.05) 100%),
      radial-gradient(circle at ${50 - accelData.x * 25}% ${50 - accelData.y * 25}%, 
        rgba(255, 248, 220, 0.2) 0%,
        rgba(245, 245, 220, 0.15) 30%,
        rgba(230, 230, 250, 0.1) 60%,
        rgba(240, 248, 255, 0.05) 100%),
      linear-gradient(135deg, 
        rgba(123, 104, 238, 0.1) 0%,
        rgba(147, 112, 219, 0.08) 25%,
        rgba(72, 61, 139, 0.06) 50%,
        rgba(25, 25, 112, 0.04) 100%)
    `
  };

  return (
    <div className="relative min-h-screen">
      {/* Dynamic Monet Background */}
      <div 
        ref={backgroundRef}
        className="fixed inset-0 transition-all duration-300 ease-out"
        style={dynamicStyle}
      />
      
      {/* Content Overlay */}
      <div className="relative z-10">
        <Layout>
          <div></div>
        </Layout>
      </div>
    </div>
  );
}
