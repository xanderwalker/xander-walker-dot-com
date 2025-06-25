import { Link } from 'wouter';
import Layout from '@/components/layout';
import { Button } from '@/components/ui/button';

export default function About() {
  return (
    <Layout title="BIO" subtitle="Get to know the person behind the code">
      <div className="max-w-4xl mx-auto">
        <div className="glassmorphism rounded-3xl p-8 md:p-12 mb-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="font-xanman text-3xl md:text-4xl font-bold mb-6 text-electric-orange">
                Creative Developer
              </h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                I'm a passionate developer who loves creating unique digital experiences. 
                With a background in both design and development, I bridge the gap between 
                beautiful aesthetics and functional code.
              </p>
              <p className="text-gray-700 leading-relaxed mb-6">
                My journey started with curiosity about how websites work, and it's evolved 
                into a career dedicated to pushing the boundaries of what's possible on the web.
              </p>
            </div>
            <div className="glassmorphism rounded-2xl p-6">
              <h3 className="font-semibold text-xl mb-4 text-cyan-blue">Skills & Expertise</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-neon-green font-medium">Frontend</div>
                  <div className="text-gray-600">React, TypeScript</div>
                  <div className="text-gray-600">Next.js, Tailwind</div>
                </div>
                <div>
                  <div className="text-electric-red font-medium">Backend</div>
                  <div className="text-gray-600">Node.js, Express</div>
                  <div className="text-gray-600">PostgreSQL, APIs</div>
                </div>
                <div>
                  <div className="text-electric-orange font-medium">Design</div>
                  <div className="text-gray-600">UI/UX Design</div>
                  <div className="text-gray-600">Animation, Figma</div>
                </div>
                <div>
                  <div className="text-cyan-blue font-medium">Tools</div>
                  <div className="text-gray-600">Git, Docker</div>
                  <div className="text-gray-600">CI/CD, Testing</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <Link href="/">
            <Button variant="outline" className="bg-black bg-opacity-10 border-black border-opacity-20 hover:bg-opacity-20">
              ← Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
