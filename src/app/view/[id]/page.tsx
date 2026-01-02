import { kv } from '@vercel/kv';
import { notFound } from 'next/navigation';

interface ArtifactData {
  code: string;
  title?: string;
  tags?: string[];
  createdAt?: number;
  id?: string;
}

interface ViewPageProps {
  params: Promise<{ id: string }>;
}

export default async function ViewPage({ params }: ViewPageProps) {
  const { id } = await params;

  // Get artifact from KV store
  const artifact = await kv.get<ArtifactData | string>(`artifact:${id}`);

  if (!artifact) {
    notFound();
  }

  // Support both old format (string) and new format (object)
  const code = typeof artifact === 'string' ? artifact : artifact.code;

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
