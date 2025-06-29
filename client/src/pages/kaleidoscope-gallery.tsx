import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import Layout from '../components/layout';

interface KaleidoscopeSubmission {
  id: number;
  imageData: string;
  flowerCount: number;
  createdAt: string;
}

export default function KaleidoscopeGallery() {
  const { data: submissions = [], isLoading, error } = useQuery<KaleidoscopeSubmission[]>({
    queryKey: ['/api/kaleidoscope-submissions'],
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Layout title="KALEIDOSCOPE GALLERY" subtitle="Loading submissions...">
        <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-black text-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mx-auto mb-4"></div>
            <p className="text-lg">Loading gallery...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="KALEIDOSCOPE GALLERY" subtitle="Error loading submissions">
        <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-black text-white flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 text-lg mb-4">Failed to load gallery</p>
            <Link href="/projects">
              <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors">
                Back to Projects
              </button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-black text-white"
      style={{
        fontFamily: 'Georgia, "Times New Roman", Times, serif'
      }}
    >
      {/* Navigation */}
      <div className="absolute top-4 left-4 z-50">
        <Link href="/projects">
          <button className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors">
            ← Projects
          </button>
        </Link>
      </div>

      <div className="absolute top-4 right-4 z-50">
        <Link href="/projects/camera-kaleidoscope">
          <button className="px-4 py-2 bg-pink-600/80 backdrop-blur-sm rounded-lg text-white hover:bg-pink-700/80 transition-colors">
            Create New Garden
          </button>
        </Link>
      </div>

      {/* Header */}
      <div className="pt-20 pb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
          KALEIDOSCOPE GALLERY
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto px-4">
          A collection of beautiful kaleidoscope flower gardens created by visitors
        </p>
        <div className="mt-4 text-sm text-gray-400">
          {submissions.length} garden{submissions.length !== 1 ? 's' : ''} created
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="container mx-auto px-4 pb-20">
        {submissions.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">🌸</div>
            <h3 className="text-2xl font-semibold mb-4">No gardens yet</h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Be the first to create a beautiful kaleidoscope flower garden! Your creation will appear here for everyone to enjoy.
            </p>
            <Link href="/projects/camera-kaleidoscope">
              <button className="px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 rounded-lg text-white font-semibold transition-all transform hover:scale-105">
                Create First Garden
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="bg-white/5 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
              >
                {/* Image */}
                <div className="aspect-square overflow-hidden">
                  <img
                    src={submission.imageData}
                    alt={`Kaleidoscope garden with ${submission.flowerCount} flowers`}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-semibold text-pink-300">
                      {submission.flowerCount} Flowers
                    </div>
                    <div className="text-xs text-gray-400">
                      #{submission.id}
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    {formatDate(submission.createdAt)}
                  </div>

                  {/* Download button */}
                  <div className="mt-3">
                    <a
                      href={submission.imageData}
                      download={`kaleidoscope-garden-${submission.id}.png`}
                      className="block w-full px-3 py-2 bg-gradient-to-r from-pink-600/20 to-purple-600/20 hover:from-pink-600/40 hover:to-purple-600/40 rounded-lg text-white text-sm text-center transition-all border border-pink-400/20 hover:border-pink-400/40"
                    >
                      Download Garden
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Gallery Stats */}
        {submissions.length > 0 && (
          <div className="mt-16 text-center">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 inline-block">
              <h3 className="text-xl font-semibold mb-4 text-pink-300">Gallery Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">
                    {submissions.length}
                  </div>
                  <div className="text-sm text-gray-400">Gardens Created</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {submissions.reduce((sum, sub) => sum + sub.flowerCount, 0)}
                  </div>
                  <div className="text-sm text-gray-400">Total Flowers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {submissions.length > 0 ? Math.round(submissions.reduce((sum, sub) => sum + sub.flowerCount, 0) / submissions.length) : 0}
                  </div>
                  <div className="text-sm text-gray-400">Avg. Flowers</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}