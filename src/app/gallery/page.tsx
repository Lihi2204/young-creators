'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  createdAt: number;
  hasCode: boolean;
}

const TAG_EMOJI: Record<string, string> = {
  'משחק': '🎮',
  'ציור': '🎨',
  'סיפור': '📖',
  'כלי': '🔧',
  'יצירה': '✨'
};

const FILTER_TAGS = ['הכל', 'משחק', 'ציור', 'סיפור', 'כלי'];

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('הכל');

  useEffect(() => {
    fetchGallery();
  }, [activeFilter]);

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const tag = activeFilter === 'הכל' ? '' : activeFilter;
      const response = await fetch(`/api/gallery${tag ? `?tag=${tag}` : ''}`);
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Failed to fetch gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" dir="rtl">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🖼️</span>
              <h1 className="text-2xl font-bold text-white">גלריית היצירות</h1>
            </div>
            <Link
              href="/"
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full font-medium transition-all flex items-center gap-2"
            >
              <span>🏠</span>
              <span>חזרה לדף הבית</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap justify-center gap-2">
          {FILTER_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveFilter(tag)}
              className={`
                px-4 py-2 rounded-full font-medium transition-all
                ${activeFilter === tag
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
                }
              `}
            >
              {tag !== 'הכל' && <span className="ml-1">{TAG_EMOJI[tag]}</span>}
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery grid */}
      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-white text-xl flex items-center gap-3">
              <span className="animate-spin text-3xl">⏳</span>
              <span>טוען יצירות...</span>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-6xl block mb-4">🎨</span>
            <p className="text-white text-xl">אין עדיין יצירות בגלריה</p>
            <p className="text-white/70 mt-2">היצירות שתפרסמו יופיעו כאן!</p>
            <Link
              href="/"
              className="inline-block mt-6 bg-white text-purple-600 px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform"
            >
              צור יצירה חדשה
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map(item => (
              <Link
                key={item.id}
                href={`/view/${item.id}`}
                className="group bg-white rounded-2xl shadow-xl overflow-hidden hover:scale-105 transition-transform duration-300"
              >
                {/* Preview placeholder */}
                <div className="h-40 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                  <span className="text-6xl opacity-50 group-hover:scale-110 transition-transform">
                    {TAG_EMOJI[item.tags?.[0]] || '✨'}
                  </span>
                </div>

                {/* Card content */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 text-lg truncate">
                    {item.title || 'יצירה ללא שם'}
                  </h3>
                  {item.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex gap-1">
                      {item.tags?.map(tag => (
                        <span
                          key={tag}
                          className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full"
                        >
                          {TAG_EMOJI[tag]} {tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
