import { Link } from 'wouter';
import Layout from '../components/layout';

export default function Projects() {
  const projects = [
    {
      title: "JERRY SEINFELD",
      description: "Interactive cartoon drawing of Jerry Seinfeld with moveable arms and legs. Drag the limbs around to create different poses and animations in this minimalist character interface.",
      tags: "Interactive • Cartoon • Animation",
      link: "/projects/jerry-seinfeld"
    },
    {
      title: "MONET PAINT SWIRLING",
      description: "Interactive paint mixing inspired by Claude Monet's water lily paintings. Mouse movement or device tilting creates beautiful color gradients that blend and morph in real-time like watercolors.",
      tags: "Interactive • Art • Sensors",
      link: "/projects/monet-paint"
    },
    {
      title: "SPOTIFY LYRICS",
      description: "Real-time lyrics display for your currently playing Spotify track. Connect with your Spotify account to view synchronized lyrics for any song you're listening to.",
      tags: "Music • API • Real-time",
      link: "/projects/spotify-lyrics"
    },
    {
      title: "SPOTIFY API TEST",
      description: "Comprehensive Spotify API data viewer showing all available real-time information. Displays album art, track details, device info, playback state, and raw API responses in readable format.",
      tags: "Music • API • Data • Testing",
      link: "/projects/spotify-api-test"
    },
    {
      title: "CAMERA SYSTEM",
      description: "Multi-camera detection and live video streaming system. Automatically detects all available cameras (front/rear) and displays simultaneous video feeds with device identification.",
      tags: "Camera • Video • Hardware",
      link: "/projects/camera"
    },
    {
      title: "SENSOR DASHBOARD",
      description: "Comprehensive device sensor monitoring with visual indicators. Displays accelerometer, compass, gyroscope, sound level, brightness, battery, temperature, and proximity sensors in real-time.",
      tags: "Sensors • Hardware • Monitoring",
      link: "/projects/sensor-dashboard"
    },
    {
      title: "GLASS OF WATER",
      description: "Realistic water simulation that responds to device tilting. Water particles slosh around the screen using accelerometer data for authentic physics.",
      tags: "Physics • Accelerometer • Fluid",
      link: "/projects/glass-of-water"
    },
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
    },
    {
      title: "ROULETTE WHEEL",
      description: "Interactive roulette wheel with realistic physics simulation. Drag to spin the wheel, drop the ball, and watch it bounce to a winning number.",
      tags: "Physics • Interactive • Gaming",
      link: "/projects/roulette"
    },
    {
      title: "PIXEL CLOCK",
      description: "Minimalist clock with 1-pixel balls dropping continuously. 10 balls fall every second, cylinder clears every minute for precise time visualization.",
      tags: "Minimalist • Physics • Time",
      link: "/projects/pixel-clock"
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
                <div className="glassmorphism rounded-2xl p-6 relative z-30 pointer-events-auto cursor-pointer hover:bg-opacity-90 transition-all duration-300 group">
                  {/* Project Title */}
                  <div className="font-serif text-black mb-4 text-center group-hover:text-gray-600 transition-colors" style={{fontSize: '32px', lineHeight: '1.2', fontFamily: 'Georgia, serif'}}>
                    {project.title}
                  </div>
                  
                  {/* Project Description */}
                  <div className="text-black font-serif text-center mb-4" style={{fontSize: '18px', lineHeight: '1.3', fontFamily: 'Georgia, serif'}}>
                    {project.description}
                  </div>
                  
                  {/* Project Tags */}
                  <div className="font-serif text-gray-500 text-center" style={{fontSize: '14px', lineHeight: '1.3', fontFamily: 'Georgia, serif'}}>
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