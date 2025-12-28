import { kv } from '@vercel/kv';
import { notFound } from 'next/navigation';

interface ViewPageProps {
  params: Promise<{ id: string }>;
}

export default async function ViewPage({ params }: ViewPageProps) {
  const { id } = await params;

  // Get artifact from KV store
  const code = await kv.get<string>(`artifact:${id}`);

  if (!code) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 px-4 py-3 flex items-center gap-2">
            <span className="text-2xl">🎨</span>
            <span className="font-bold text-white text-lg">יצירה מ-יוצרים צעירים</span>
          </div>
          <div className="p-4">
            <iframe
              srcDoc={code}
              className="w-full border-0 rounded-xl"
              style={{ height: '80vh', minHeight: '500px' }}
              sandbox="allow-scripts"
              title="Artifact"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
