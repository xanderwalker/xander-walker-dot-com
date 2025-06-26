import Layout from '@/components/layout';

export default function Home() {
  return (
    <div className="relative min-h-screen">
      {/* Background Image/GIF Container - Currently using fallback, replace with your compressed GIF */}
      <div 
        className="fixed inset-0 bg-gray-100 z-0"
        style={{
          /* Uncomment when you have a compressed version of your GIF (under 3.5MB):
          backgroundImage: 'url("/assets/your-compressed-gif.gif")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
          */
        }}
      />
      
      {/* Content Overlay */}
      <div className="relative z-10 bg-white bg-opacity-90">
        <Layout>
          <div></div>
        </Layout>
      </div>
    </div>
  );
}
