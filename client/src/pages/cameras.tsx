import { Link } from 'wouter';
import Layout from '../components/layout';

export default function Cameras() {
  const cameras = [
    {
      title: "20-PHOTO SECTIONAL COLLAGE",
      description: "High-speed capture system that takes 20 photos in 5 seconds. Each photo contributes one specific grid section to create a seamless composite image with square sections.",
      tags: "20 Photos • 4fps • Square Grid • 5x4 Layout",
      timestamp: "June 30, 2025",
      link: "/projects/camera-collage"
    },
    {
      title: "100-SHOT HEXAGONAL COLLAGE", 
      description: "Ultra-fast capture system taking 100 photos in 1 second. Creates interlocking honeycomb composite images where each photo contributes one hexagonal section with no gaps between sections.",
      tags: "100 Photos • 100fps • Interlocking Hexagons • Honeycomb Pattern",
      timestamp: "June 30, 2025",
      link: "/projects/camera-hexagon"
    }
  ];

  return (
    <Layout 
      title="CAMERA SYSTEMS" 
      subtitle="Advanced photo collage and composite creators"
    >
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}>
              CAMERA SYSTEMS
            </h1>
            <p className="text-xl text-gray-300" style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}>
              High-speed photo capture systems that create composite artworks from rapid sequential photography
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {cameras.map((camera, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105"
              >
                <div className="mb-6">
                  <h2 
                    className="text-2xl font-bold mb-3 text-white"
                    style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}
                  >
                    {camera.title}
                  </h2>
                  <p 
                    className="text-gray-300 text-lg leading-relaxed mb-4"
                    style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}
                  >
                    {camera.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {camera.tags.split(' • ').map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-3 py-1 bg-white/20 rounded-full text-sm text-white"
                        style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div 
                    className="text-sm text-gray-400 mb-6"
                    style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}
                  >
                    {camera.timestamp}
                  </div>
                </div>

                <Link href={camera.link}>
                  <button 
                    className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-lg text-white font-semibold transition-all duration-300 transform hover:scale-105"
                    style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}
                  >
                    Open Camera System
                  </button>
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/projects">
              <button 
                className="px-8 py-3 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
                style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}
              >
                ← Back to Projects
              </button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}