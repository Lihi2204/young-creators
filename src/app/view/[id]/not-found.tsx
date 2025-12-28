export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800">לא נמצא ארטיפקט</h1>
        <p className="text-gray-600 mt-2">הקישור לא תקין או שפג תוקפו</p>
        <a
          href="/"
          className="inline-block mt-4 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium hover:opacity-90 transition-opacity"
        >
          חזרה לדף הבית
        </a>
      </div>
    </div>
  );
}
