import { Link } from 'wouter';
import { useState } from 'react';
import Layout from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate form submission
    toast({
      title: "Message Sent!",
      description: "Thanks for reaching out. I'll get back to you soon!",
    });
    
    setFormData({ name: '', email: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <Layout title="CONTACT" subtitle="Let's create something amazing together">
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="glassmorphism border-black border-opacity-10">
            <CardContent className="p-8">
              <h3 className="font-xanman text-2xl font-bold mb-6 text-electric-orange">
                Send a Message
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Input
                    name="name"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="bg-black bg-opacity-10 border-black border-opacity-20 text-black placeholder:text-gray-600"
                  />
                </div>
                <div>
                  <Input
                    name="email"
                    type="email"
                    placeholder="Your Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="bg-black bg-opacity-10 border-black border-opacity-20 text-black placeholder:text-gray-600"
                  />
                </div>
                <div>
                  <Textarea
                    name="message"
                    placeholder="Your Message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="bg-black bg-opacity-10 border-black border-opacity-20 text-black placeholder:text-gray-600 resize-none"
                  />
                </div>
                <Button 
                  type="submit"
                  className="w-full bg-electric-orange hover:bg-electric-orange hover:opacity-90 text-black"
                >
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="glassmorphism border-black border-opacity-10">
              <CardContent className="p-6">
                <div className="text-2xl mb-4 text-cyan-blue">📧</div>
                <h4 className="font-semibold text-lg mb-2 text-black">Email</h4>
                <p className="text-gray-700">xander@example.com</p>
              </CardContent>
            </Card>

            <Card className="glassmorphism border-black border-opacity-10">
              <CardContent className="p-6">
                <div className="text-2xl mb-4 text-neon-green">🌍</div>
                <h4 className="font-semibold text-lg mb-2 text-black">Location</h4>
                <p className="text-gray-700">Available for remote work worldwide</p>
              </CardContent>
            </Card>

            <Card className="glassmorphism border-black border-opacity-10">
              <CardContent className="p-6">
                <div className="text-2xl mb-4 text-electric-red">⚡</div>
                <h4 className="font-semibold text-lg mb-2 text-black">Response Time</h4>
                <p className="text-gray-700">Usually within 24 hours</p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="text-center mt-12">
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
