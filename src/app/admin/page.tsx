'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  createdAt: number;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    const response = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (response.ok) {
      setIsAuthenticated(true);
      fetchItems();
    } else {
      setMessage('סיסמה שגויה');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/gallery');
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: GalleryItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
  };

  const handleSave = async (id: string) => {
    try {
      const response = await fetch('/api/admin/gallery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title: editTitle }),
      });

      if (response.ok) {
        setItems(items.map(item =>
          item.id === id ? { ...item, title: editTitle } : item
        ));
        setEditingId(null);
        setMessage('נשמר בהצלחה!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Failed to save:', error);
      setMessage('שגיאה בשמירה');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('למחוק את היצירה הזו?')) return;

    try {
      const response = await fetch('/api/admin/gallery', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        setItems(items.filter(item => item.id !== id));
        setMessage('נמחק בהצלחה!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      setMessage('שגיאה במחיקה');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Find duplicates by title
  const duplicates = items.reduce((acc, item) => {
    const key = item.title.toLowerCase().trim();
    if (!acc[key]) acc[key] = [];
    acc[key].push(item.id);
    return acc;
  }, {} as Record<string, string[]>);

  const duplicateIds = new Set(
    Object.values(duplicates)
      .filter(ids => ids.length > 1)
      .flat()
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center" dir="rtl">
        <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full mx-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">כניסת מנהל</h1>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="סיסמה"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none mb-4"
          />

          <button
            onClick={handleLogin}
            className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors"
          >
            כניסה
          </button>

          {message && (
            <p className="text-red-500 text-center mt-4">{message}</p>
          )}

          <Link
            href="/"
            className="block text-center text-purple-600 mt-4 hover:underline"
          >
            חזרה לדף הבית
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      {/* Header */}
      <div className="bg-purple-600 text-white py-4 px-6 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">ניהול גלריה</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-80">{items.length} יצירות</span>
            <Link
              href="/gallery"
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm transition-colors"
            >
              לגלריה
            </Link>
            <Link
              href="/"
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm transition-colors"
            >
              לדף הבית
            </Link>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg z-50">
          {message}
        </div>
      )}

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20">
            <span className="text-4xl animate-spin inline-block">⏳</span>
            <p className="text-gray-500 mt-4">טוען...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-right py-4 px-6 font-semibold text-gray-600">שם</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-600">תגיות</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-600">תאריך</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-600">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b hover:bg-gray-50 ${duplicateIds.has(item.id) ? 'bg-yellow-50' : ''}`}
                  >
                    <td className="py-4 px-6">
                      {editingId === item.id ? (
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:border-purple-500 focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <div>
                          <span className="font-medium text-gray-800">{item.title}</span>
                          {duplicateIds.has(item.id) && (
                            <span className="mr-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                              כפילות
                            </span>
                          )}
                          {item.description && (
                            <p className="text-sm text-gray-500 mt-1 truncate max-w-md">
                              {item.description}
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-1">
                        {item.tags?.map(tag => (
                          <span
                            key={tag}
                            className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        {editingId === item.id ? (
                          <>
                            <button
                              onClick={() => handleSave(item.id)}
                              className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-600 transition-colors"
                            >
                              שמור
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-400 transition-colors"
                            >
                              ביטול
                            </button>
                          </>
                        ) : (
                          <>
                            <a
                              href={`/view/${item.id}`}
                              target="_blank"
                              className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-600 transition-colors"
                            >
                              צפה
                            </a>
                            <button
                              onClick={() => handleEdit(item)}
                              className="bg-purple-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-purple-600 transition-colors"
                            >
                              ערוך
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-600 transition-colors"
                            >
                              מחק
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {items.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                אין יצירות בגלריה
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
