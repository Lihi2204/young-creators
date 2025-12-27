'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ArtifactViewer() {
  const searchParams = useSearchParams();
  const encodedCode = searchParams.get('code');

  if (!encodedCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800">לא נמצא ארטיפקט</h1>
          <p className="text-gray-600 mt-2">הקישור לא תקין</p>
        </div>
      </div>
    );
  }

  // Decode the code from URL-safe base64 with UTF-8 support
  let code = '';
  try {
    const decodedBase64 = decodeURIComponent(encodedCode);
    // atob() doesn't support UTF-8, so we need to decode manually
    const binaryString = atob(decodedBase64);
    const bytes = Uint8Array.from(binaryString, char => char.charCodeAt(0));
    code = new TextDecoder('utf-8').decode(bytes);
  } catch {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800">שגיאה בקריאת הארטיפקט</h1>
        </div>
      </div>
    );
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

export default function ViewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-xl">טוען...</div>
      </div>
    }>
      <ArtifactViewer />
    </Suspense>
  );
}
