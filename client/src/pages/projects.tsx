import { Link } from 'wouter';

export default function Projects() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header with navigation home */}
      <header className="p-8 flex justify-center">
        <a 
          href="/" 
          className="text-black font-xanman-wide font-bold text-4xl md:text-6xl hover:opacity-70 transition-opacity duration-200 cursor-pointer"
        >
          XANDER WALKER
        </a>
      </header>

      {/* Projects Grid */}
      <div className="flex flex-col items-center justify-center p-8">
        <h2 className="font-xanman-wide text-3xl mb-12 text-center">PROJECTS</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
          
          {/* 333 Balls Project Card */}
          <Link href="/projects/333-balls">
            <div className="bg-white border-2 border-black p-8 hover:bg-gray-50 transition-colors cursor-pointer group">
              <h3 className="font-xanman-wide text-2xl mb-4 group-hover:text-gray-600">333 BALLS</h3>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Interactive physics simulation with 333 colorful balls that respond to device motion. 
                Features smooth gradient colors, collision detection, and accelerometer controls on mobile.
              </p>
              <div className="text-sm text-gray-500 uppercase tracking-wider">
                Physics • Interactive • Mobile
              </div>
            </div>
          </Link>

          {/* Clock Project Card */}
          <Link href="/projects/clock">
            <div className="bg-white border-2 border-black p-8 hover:bg-gray-50 transition-colors cursor-pointer group">
              <h3 className="font-xanman-wide text-2xl mb-4 group-hover:text-gray-600">CLOCK</h3>
              <p className="text-gray-700 mb-6 leading-relaxed">
                A modern digital clock interface with custom styling and real-time updates.
                Clean design with precise time display.
              </p>
              <div className="text-sm text-gray-500 uppercase tracking-wider">
                Time • Design • Interface
              </div>
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
}