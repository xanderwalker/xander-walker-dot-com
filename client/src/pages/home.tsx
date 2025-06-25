import Layout from '@/components/layout';
import FloatingNavigation from '@/components/floating-navigation';

export default function Home() {
  return (
    <Layout>
      <FloatingNavigation />
      
      <div className="mt-16 md:mt-20 max-w-4xl mx-auto text-center">
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          <div className="glassmorphism rounded-2xl p-6 md:p-8">
            <div className="text-3xl mb-4">🚀</div>
            <h3 className="font-semibold text-lg mb-3">Innovation</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Pushing boundaries with cutting-edge technology and creative solutions.
            </p>
          </div>
          
          <div className="glassmorphism rounded-2xl p-6 md:p-8">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="font-semibold text-lg mb-3">Performance</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Optimized experiences that load fast and feel smooth on any device.
            </p>
          </div>
          
          <div className="glassmorphism rounded-2xl p-6 md:p-8">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="font-semibold text-lg mb-3">Precision</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Pixel-perfect designs crafted with attention to every detail.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
