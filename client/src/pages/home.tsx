import Layout from '@/components/layout';
import { useLocation } from 'wouter';

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <Layout>
      <div className="fixed bottom-4 right-4 z-50">
        <button 
          onClick={() => setLocation('/about')} 
          className="bg-electric-orange text-white px-4 py-2 rounded font-xanman-wide"
        >
          Test Bio Link
        </button>
      </div>
    </Layout>
  );
}
