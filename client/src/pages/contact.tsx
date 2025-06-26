import Layout from '@/components/layout';

export default function Contact() {
  const socialLinks = [
    {
      name: "LINKEDIN",
      url: "https://www.linkedin.com/in/xanderwalker/"
    },
    {
      name: "INSTAGRAM", 
      url: "https://www.instagram.com/xanderwalker/"
    },
    {
      name: "X",
      url: "https://x.com/xanderwalker"
    }
  ];

  return (
    <Layout title="XANDER WALKER">
      <div className="max-w-4xl mx-auto relative z-30">
        <div className="space-y-6">
          {socialLinks.map((social, index) => (
            <a
              key={index}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block glassmorphism rounded-2xl p-8 relative z-30 pointer-events-auto hover:bg-electric-orange hover:bg-opacity-20 transition-colors duration-300"
            >
              <div className="text-black font-xanman-wide uppercase text-center" style={{fontSize: '48px', lineHeight: '1.2'}}>
                {social.name}
              </div>
            </a>
          ))}
        </div>
      </div>
    </Layout>
  );
}