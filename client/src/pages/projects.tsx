import PhysicsBalls from '../components/physics-balls';

export default function Projects() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Header with navigation home */}
      <header className="absolute top-0 left-0 right-0 z-40 p-8 flex justify-center">
        <a 
          href="/" 
          className="text-black font-xanman-wide font-bold text-4xl md:text-6xl hover:opacity-70 transition-opacity duration-200 cursor-pointer"
        >
          XANDER WALKER
        </a>
      </header>

      {/* Physics balls background */}
      <PhysicsBalls />
    </div>
  );
}