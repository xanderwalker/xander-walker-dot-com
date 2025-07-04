import { Link } from 'wouter';
import Layout from '../components/layout';

export default function Projects() {
  const projects = [
    {
      title: "CAMERA SYSTEMS",
      description: "Advanced high-speed photo capture systems. Includes 20-shot sectional collage (4fps) with square grid sections, and 100-shot hexagonal collage (10fps) with hexagonal composite sections. Professional viewfinder interfaces and automatic gallery saves.",
      tags: "Camera • Collage • Composite • Multi-Systems",
      timestamp: "June 30, 2025",
      link: "/projects/cameras"
    },
    {
      title: "KALEIDOSCOPE GALLERY",
      description: "Community gallery showcasing all the beautiful kaleidoscope flower gardens created by visitors. Browse, download, and enjoy the creative submissions from around the world.",
      tags: "Gallery • Community • Art • Collection",
      timestamp: "June 29, 2025",
      link: "/projects/kaleidoscope-gallery"
    },
    {
      title: "TENNIS BALL GUN",
      description: "American Gladiators-style defense game. Aim your tennis ball cannon to stop gladiators from reaching the bottom. Features multiple gladiator types, shields, obstacles, and progressive waves.",
      tags: "Game • Defense • American Gladiators",
      timestamp: "June 29, 2025",
      link: "/projects/tennis-ball-gun"
    },
    {
      title: "WIND CHIMES",
      description: "100 swaying reeds responding to real local wind data. Like a field of grass dancing in your actual weather conditions. Uses location services to fetch live wind speed and direction.",
      tags: "Kinetic Art • Weather API • Location",
      timestamp: "June 29, 2025",
      link: "/projects/wind-chimes"
    },
    {
      title: "SLOT MACHINE",
      description: "Classic vintage Las Vegas slot machine with 10 symbols, pullable handle, realistic spinning reels, coin payouts, and authentic casino sound effects. Features three reels, paytable, and falling coins animation.",
      tags: "Casino • Vintage • Animation",
      timestamp: "June 28, 2025",
      link: "/projects/slot-machine"
    },
    {
      title: "TRUMP CLOCK",
      description: "Political satire timepiece featuring a golden golf ball face with Trump as hour hand, Vance as minute hand, and a taco marking seconds.",
      tags: "Political • Satire • Golf",
      timestamp: "June 28, 2025",
      link: "/projects/trump-clock"
    },
    {
      title: "ANALOG CLOCK",
      description: "Traditional 12-hour analog clock with hour, minute, and second hands. Features classic Roman numerals, smooth hand movement, and elegant glassmorphism design on a dark gradient background.",
      tags: "Time • Classic • Interface",
      timestamp: "June 28, 2025",
      link: "/projects/analog-clock"
    },
    {
      title: "MONET PAINT SWIRLING",
      description: "Interactive paint mixing inspired by Claude Monet's water lily paintings. Mouse movement or device tilting creates beautiful color gradients that blend and morph in real-time like watercolors.",
      tags: "Interactive • Art • Sensors",
      timestamp: "June 27, 2025",
      link: "/projects/monet-paint"
    },
    {
      title: "SPOTIFY LYRICS",
      description: "Real-time lyrics display for your currently playing Spotify track. Connect with your Spotify account to view synchronized lyrics for any song you're listening to.",
      tags: "Music • API • Real-time",
      timestamp: "June 27, 2025",
      link: "/projects/spotify-lyrics"
    },
    {
      title: "SPOTIFY API TEST",
      description: "Comprehensive Spotify API data viewer showing all available real-time information. Displays album art, track details, device info, playback state, and raw API responses in readable format.",
      tags: "Music • API • Data • Testing",
      timestamp: "June 27, 2025",
      link: "/projects/spotify-api-test"
    },
    {
      title: "CAMERA SYSTEM",
      description: "Multi-camera detection and live video streaming system. Automatically detects all available cameras (front/rear) and displays simultaneous video feeds with device identification.",
      tags: "Camera • Video • Hardware",
      timestamp: "June 27, 2025",
      link: "/projects/camera"
    },
    {
      title: "SENSOR DASHBOARD",
      description: "Comprehensive device sensor monitoring with visual indicators. Displays accelerometer, compass, gyroscope, sound level, brightness, battery, temperature, and proximity sensors in real-time.",
      tags: "Sensors • Hardware • Monitoring",
      timestamp: "June 27, 2025",
      link: "/projects/sensor-dashboard"
    },
    {
      title: "GLASS OF WATER",
      description: "Realistic water simulation that responds to device tilting. Water particles slosh around the screen using accelerometer data for authentic physics.",
      tags: "Physics • Accelerometer • Fluid",
      timestamp: "June 26, 2025",
      link: "/projects/glass-of-water"
    },
    {
      title: "333 BALLS",
      description: "Interactive physics simulation with 333 colorful balls that respond to device motion. Features smooth gradient colors, collision detection, and accelerometer controls on mobile.",
      tags: "Physics • Interactive • Mobile",
      timestamp: "June 26, 2025",
      link: "/projects/333-balls"
    },
    {
      title: "CLOCK",
      description: "A modern digital clock interface with custom styling and real-time updates. Clean design with precise time display.",
      tags: "Time • Design • Interface",
      timestamp: "June 26, 2025", 
      link: "/projects/clock"
    },
    {
      title: "ROULETTE WHEEL",
      description: "Interactive roulette wheel with realistic physics simulation. Drag to spin the wheel, drop the ball, and watch it bounce to a winning number.",
      tags: "Physics • Interactive • Gaming",
      timestamp: "June 27, 2025",
      link: "/projects/roulette"
    },
    {
      title: "PIXEL CLOCK",
      description: "Minimalist clock with 1-pixel balls dropping continuously. 10 balls fall every second, cylinder clears every minute for precise time visualization.",
      tags: "Minimalist • Physics • Time",
      timestamp: "June 26, 2025",
      link: "/projects/pixel-clock"
    }
  ];

  return (
    <Layout title="XANDER WALKER">
      <div className="max-w-7xl mx-auto relative z-30">
        {/* Projects Section */}
        <div className="mb-12">
          <h2 className=" mb-12 text-center text-black" style={{fontSize: '55px', lineHeight: '1.2'}}>
            PROJECTS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project, index) => (
              <Link key={index} href={project.link}>
                <div className="glassmorphism rounded-2xl p-6 relative z-30 pointer-events-auto cursor-pointer hover:bg-opacity-90 transition-all duration-300 group">
                  {/* Project Title */}
                  <div className=" text-black mb-4 text-center group-hover:text-gray-600 transition-colors" style={{fontSize: '32px', lineHeight: '1.2'}}>
                    {project.title}
                  </div>
                  
                  {/* Project Description */}
                  <div className="text-black  text-center mb-4" style={{fontSize: '18px', lineHeight: '1.3'}}>
                    {project.description}
                  </div>
                  
                  {/* Project Tags */}
                  <div className=" text-gray-500 text-center mb-3" style={{fontSize: '14px', lineHeight: '1.3'}}>
                    {project.tags}
                  </div>
                  
                  {/* Project Timestamp */}
                  <div className=" text-gray-400 text-center" style={{fontSize: '12px', lineHeight: '1.3'}}>
                    {project.timestamp}
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