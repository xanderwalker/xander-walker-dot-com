import { ReactNode } from 'react';
import BouncingCircles from './bouncing-circles';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export default function Layout({ children, title = "XANDER WALKER", subtitle = "Creative Developer & Digital Artist" }: LayoutProps) {
  return (
    <div className="bg-white text-gray-900 min-h-screen relative">
      <BouncingCircles />
      
      <div className="relative z-20 min-h-screen flex flex-col items-center justify-center px-4 md:px-8">
        <header className="text-center mb-12 md:mb-16">
          <h1 className="font-xanman text-5xl md:text-7xl lg:text-8xl font-bold text-black mb-4 floating-animation">
            {title}
          </h1>
          <p className="text-lg md:text-xl text-gray-700 font-light max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        </header>
        
        {children}
      </div>
    </div>
  );
}
