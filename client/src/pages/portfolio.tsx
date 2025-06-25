import { Link } from 'wouter';
import Layout from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Portfolio() {
  const projects = [
    {
      title: "Interactive Dashboard",
      description: "A real-time analytics dashboard with beautiful visualizations",
      tech: "React, D3.js, WebSockets",
      color: "electric-orange"
    },
    {
      title: "E-commerce Platform",
      description: "Full-stack shopping experience with payment integration",
      tech: "Next.js, Stripe, PostgreSQL",
      color: "cyan-blue"
    },
    {
      title: "Mobile App",
      description: "Cross-platform mobile application for task management",
      tech: "React Native, Firebase",
      color: "neon-green"
    },
    {
      title: "AI-Powered Tool",
      description: "Machine learning application for content generation",
      tech: "Python, TensorFlow, REST API",
      color: "electric-red"
    }
  ];

  return (
    <Layout title="MY WORK" subtitle="Projects that showcase creativity and technical expertise">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {projects.map((project, index) => (
            <Card key={index} className="glassmorphism border-white border-opacity-10 hover:border-opacity-30 transition-all duration-300">
              <CardContent className="p-6">
                <div className={`text-2xl mb-4 text-${project.color}`}>
                  {index === 0 && "📊"}
                  {index === 1 && "🛒"}
                  {index === 2 && "📱"}
                  {index === 3 && "🤖"}
                </div>
                <h3 className="font-xanman text-xl font-bold mb-3 text-white">
                  {project.title}
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.tech.split(', ').map((tech, techIndex) => (
                    <span 
                      key={techIndex}
                      className="px-2 py-1 bg-white bg-opacity-10 rounded-full text-xs text-gray-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center glassmorphism rounded-2xl p-8">
          <h3 className="font-xanman text-2xl font-bold mb-4 text-white">
            Want to see more?
          </h3>
          <p className="text-gray-300 mb-6">
            Check out my GitHub for more projects and open-source contributions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="outline" 
              className="bg-electric-orange bg-opacity-20 border-electric-orange border-opacity-50 hover:bg-opacity-30 text-white"
              onClick={() => window.open('https://github.com', '_blank')}
            >
              View GitHub
            </Button>
            <Link href="/">
              <Button variant="outline" className="bg-white bg-opacity-10 border-white border-opacity-20 hover:bg-opacity-20">
                ← Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
