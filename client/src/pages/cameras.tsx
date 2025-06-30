import { Link } from 'wouter';
import Layout from '../components/layout';

export default function Cameras() {
  const cameras = [
    {
      title: "HYBRID TESSELLATION CAMERA", 
      description: "Advanced geometric patterns combining hexagonal and square shapes in an alternating 8×8 grid. Creates stunning dual-pattern composites with perfect tessellation symmetry.",
      tags: "64 Photos • 8fps • Hex-Square Hybrid • Advanced Geometry",
      timestamp: "June 30, 2025",
      link: "/projects/camera-hex-square"
    },
    {
      title: "ULTRA-DETAIL MICRO CAMERA", 
      description: "Maximum resolution capture system with micro-rectangle tessellation in a dense 10×8 grid. Each tiny section contributes precise detail for ultra-high definition composites.",
      tags: "80 Photos • 8fps • Micro-Rectangles • Ultra Resolution",
      timestamp: "June 30, 2025",
      link: "/projects/camera-optimal-80"
    },
    {
      title: "ASPECT RATIO CAMERA", 
      description: "Perfect proportional capture maintaining camera's natural 4×3 aspect ratio. No distortion, clean rectangular sections that preserve original image quality and composition.",
      tags: "12 Photos • 4fps • 4×3 Rectangles • No Distortion",
      timestamp: "June 30, 2025",
      link: "/projects/camera-optimal"
    },
    {
      title: "RAPID SQUARE CAMERA", 
      description: "Ultra-fast burst mode creating perfect square tessellations at maximum speed. Captures 100 photos in 1 second for dynamic action sequences and motion studies.",
      tags: "100 Photos • 100fps • Square Grid • Burst Mode",
      timestamp: "June 30, 2025",
      link: "/projects/camera-squares"
    },
    {
      title: "HONEYCOMB PATTERN CAMERA", 
      description: "Natural hexagonal tessellation inspired by bee hive structures. Creates organic honeycomb patterns with interlocking hexagons for artistic geometric compositions.",
      tags: "100 Photos • 100fps • Hexagon Grid • Natural Patterns",
      timestamp: "June 30, 2025",
      link: "/projects/camera-hexagon"
    },
    {
      title: "SECTIONAL GRID CAMERA",
      description: "Classic grid-based capture system dividing the frame into equal rectangular sections. Reliable 5×4 layout perfect for balanced compositions and portrait photography.",
      tags: "20 Photos • 4fps • Rectangular Grid • Classic Layout",
      timestamp: "June 30, 2025",
      link: "/projects/camera-collage"
    }
  ];

  return (
    <Layout 
      title="cameras" 
      subtitle="Advanced photo collage and composite creators"
    >
      <div className="min-h-screen bg-white text-gray-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xl text-gray-600">
              High-speed photo capture systems that create composite artworks from rapid sequential photography
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {cameras.map((camera, index) => (
              <div
                key={index}
                className="p-8 hover:scale-105 transition-all duration-300"
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-3 text-black">
                    {camera.title}
                  </h2>
                  <p className="text-gray-700 text-lg leading-relaxed mb-4">
                    {camera.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {camera.tags.split(' • ').map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700 border border-gray-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="text-sm text-gray-500 mb-6">
                    {camera.timestamp}
                  </div>
                </div>

                <Link href={camera.link}>
                  <button className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-white font-semibold transition-all duration-300 transform hover:scale-105">
                    Open Camera System
                  </button>
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/projects">
              <button className="px-8 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-900 transition-colors border border-gray-300">
                ← Back to Projects
              </button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}