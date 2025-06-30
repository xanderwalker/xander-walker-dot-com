import { ReactNode } from 'react';
import { Link } from 'wouter';
import BouncingCircles from './bouncing-circles';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export default function Layout({ children, title = "XANDER WALKER", subtitle = "" }: LayoutProps) {
  return (
    <div className="bg-white text-gray-900 min-h-screen relative">
      <BouncingCircles />
      
      <div className="relative z-40 min-h-screen flex flex-col items-center justify-center px-4 md:px-8 pointer-events-none">
        <header className="text-center mb-12 md:mb-16 relative z-40 pointer-events-auto max-w-full px-2 overflow-hidden">
          <Link href="/">
            <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-4 cursor-pointer hover:scale-105 transition-transform duration-300 uppercase break-words leading-tight ${
              title === "XANDER WALKER" ? "font-xanman-wide" : ""
            }`}>
              {title}
            </h1>
          </Link>
          {subtitle && (
            <p className="text-lg md:text-xl text-gray-700 font-light max-w-2xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
        </header>
        
        <div className="pointer-events-auto w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
