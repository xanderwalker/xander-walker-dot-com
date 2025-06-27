import { Link } from 'wouter';
import Layout from '../components/layout';

export default function Projects() {
  const projects = [
    {
      title: "333 BALLS",
      description: "Interactive physics simulation with 333 colorful balls that respond to device motion. Features smooth gradient colors, collision detection, and accelerometer controls on mobile.",
      tags: "Physics • Interactive • Mobile",
      link: "/projects/333-balls"
    },
    {
      title: "CLOCK",
      description: "A modern digital clock interface with custom styling and real-time updates. Clean design with precise time display.",
      tags: "Time • Design • Interface", 
      link: "/projects/clock"
    }
  ];

  return (
    <Layout title="XANDER WALKER">
      <div className="max-w-7xl mx-auto relative z-30">
        {/* Projects Section */}
        <div className="mb-12">
          <h2 className="font-serif mb-12 text-center text-black" style={{fontSize: '55px', lineHeight: '1.2', fontFamily: 'Georgia, serif'}}>
            PROJECTS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project, index) => (
              <Link key={index} href={project.link}>
                <div className="glassmorphism rounded-2xl p-8 relative z-30 pointer-events-auto cursor-pointer hover:bg-opacity-90 transition-all duration-300 group">
                  {/* Project Title */}
                  <div className="font-serif text-8xl mb-8 text-center text-black group-hover:text-gray-600 transition-colors" style={{fontFamily: 'Georgia, serif'}}>
                    {project.title}
                  </div>
                  
                  {/* Project Description */}
                  <div className="text-gray-700 font-serif text-4xl mb-8 leading-relaxed text-center" style={{fontFamily: 'Georgia, serif'}}>
                    {project.description}
                  </div>
                  
                  {/* Project Tags */}
                  <div className="text-2xl font-serif text-gray-500 uppercase tracking-wider text-center" style={{fontFamily: 'Georgia, serif'}}>
                    {project.tags}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}