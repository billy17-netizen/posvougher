'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateSuperAdminPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password || !name) {
      setError('All fields are required');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log('Submitting form with data:', { username, name });
      
      const response = await fetch('/api/create-super-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, name }),
      });
      
      const data = await response.json();
      console.log('Response received:', { status: response.status, data });
      
      if (response.ok) {
        setSuccess(data.message || 'Super admin created successfully');
        // Reset form
        setUsername('');
        setPassword('');
        setName('');
      } else {
        // Show more detailed error
        const errorMessage = data.error || data.message || 'Failed to create super admin';
        console.error('Error details:', errorMessage);
        setError(`Error (${response.status}): ${errorMessage}`);
      }
    } catch (err) {
      console.error('Error during fetch:', err);
      setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-md shadow-md border-3 border-brutalism-black overflow-hidden">
        <div className="bg-brutalism-yellow border-b-3 border-brutalism-black px-6 py-4">
          <h1 className="text-2xl font-bold">Create Super Admin</h1>
          <p className="text-sm text-brutalism-black">Development mode only</p>
        </div>
        
        <div className="p-6">
          {success && (
            <div className="mb-4 p-3 bg-green-100 border-3 border-green-600 rounded-md">
              {success}
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border-3 border-red-600 rounded-md text-red-700">
              <p className="font-bold">Error:</p>
              <p className="whitespace-pre-wrap break-words">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border-2 border-brutalism-black rounded-md"
                placeholder="Enter full name"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border-2 border-brutalism-black rounded-md"
                placeholder="Enter username"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border-2 border-brutalism-black rounded-md"
                placeholder="Enter password"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 bg-brutalism-yellow border-2 border-brutalism-black rounded-md font-medium shadow-brutal-sm hover:shadow-none hover:translate-y-1 transition-all ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Creating...' : 'Create Super Admin'}
              </button>
              
              <Link
                href="/login"
                className="text-sm text-brutalism-blue hover:underline"
              >
                Back to Login
              </Link>
            </div>
          </form>
          
          {/* Debug Section */}
          <div className="mt-8 border-t-2 border-gray-200 pt-4">
            <details className="text-sm text-gray-600">
              <summary className="cursor-pointer font-medium">Debug Information</summary>
              <div className="mt-2 bg-gray-50 p-3 rounded overflow-auto max-h-48">
                <p>Check the following if you encounter errors:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Verify that PostgreSQL is running</li>
                  <li>Check your database connection URL in .env</li>
                  <li>Ensure Prisma schema matches your database schema</li>
                  <li>Try running <code className="bg-gray-200 px-1 rounded">node create-admin.js</code> from the command line</li>
                </ul>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
} 