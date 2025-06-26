import Layout from '@/components/layout';

export default function Contact() {
  return (
    <Layout title="XANDER WALKER">
      <div className="max-w-4xl mx-auto text-center relative z-30">
        <div className="space-y-8">
          <a 
            href="https://www.linkedin.com/in/xanderwalker/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block text-black hover:text-electric-orange transition-colors duration-300 font-xanman-wide uppercase"
            style={{fontSize: '48px', lineHeight: '1.2'}}
          >
            LINKEDIN
          </a>
          
          <a 
            href="https://www.instagram.com/xanderwalker/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block text-black hover:text-electric-orange transition-colors duration-300 font-xanman-wide uppercase"
            style={{fontSize: '48px', lineHeight: '1.2'}}
          >
            INSTAGRAM
          </a>
          
          <a 
            href="https://x.com/xanderwalker" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block text-black hover:text-electric-orange transition-colors duration-300 font-xanman-wide uppercase"
            style={{fontSize: '48px', lineHeight: '1.2'}}
          >
            X
          </a>
        </div>
      </div>
    </Layout>
  );
}