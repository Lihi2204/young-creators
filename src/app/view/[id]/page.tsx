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
    <div className="min-h-screen w-full">
      <iframe
        srcDoc={code}
        className="w-full h-screen border-0"
        sandbox="allow-scripts allow-same-origin"
        title="Artifact"
      />
    </div>
  );
}
