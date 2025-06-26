import PhysicsBalls from '../components/physics-balls';

export default function Projects() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Header with navigation home */}
      <header className="absolute top-0 left-0 right-0 z-40 p-8">
        <a 
          href="/" 
          className="text-black font-xanman-wide text-4xl md:text-6xl hover:opacity-70 transition-opacity duration-200 cursor-pointer"
        >
          XANDER WALKER
        </a>
      </header>

      {/* Physics balls background */}
      <PhysicsBalls />
      
      {/* Content area - currently minimal to showcase the physics */}
      <div className="relative z-30 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-black font-xanman-wide text-6xl md:text-8xl mb-8 opacity-20">
            PROJECTS
          </h1>
        </div>
      </div>
    </div>
  );
}