import { Link } from 'wouter';
import PhysicsBalls from '../components/physics-balls';

export default function Balls333() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Header with navigation back to projects */}
      <header className="absolute top-0 left-0 right-0 z-40 p-8 flex justify-between items-center">
        <Link href="/projects">
          <button className="text-black hover:text-gray-600 transition-colors text-lg">
            ← BACK TO PROJECTS
          </button>
        </Link>
        
        <Link href="/">
          <h1 className="text-black font-xanman-wide font-bold text-4xl md:text-6xl hover:opacity-70 transition-opacity duration-200 cursor-pointer">
            XANDER WALKER
          </h1>
        </Link>
        
        <div className="w-48"></div> {/* Spacer for center alignment */}
      </header>

      {/* Physics balls simulation */}
      <PhysicsBalls />
    </div>
  );
}