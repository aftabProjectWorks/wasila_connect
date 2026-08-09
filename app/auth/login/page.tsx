'use client';

import { createClient as createBrowserClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createBrowserClient(supabaseUrl || '', supabaseAnonKey || '');

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // handle OAuth redirect results if any
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data?.session;
      if (session) {
        try {
          await fetch('/api/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: session.access_token }),
          });
        } catch (err) {
          console.error('Error syncing auth:', err);
        }
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.access_token) {
        // send to server to create member record
        fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: session.access_token }),
        }).catch((e) => console.error('sync error', e));
      }
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  async function signInWithGoogle() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
    } catch (err) {
      console.error(err);
      alert('Login failed. Check console for details.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold">Member sign in</h2>
      <p className="mt-2 text-sm text-gray-600">Sign in with Google (Supabase Auth)</p>
      <div className="mt-6">
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full bg-red-600 text-white py-2 rounded hover:opacity-95"
        >
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>
      </div>
      <p className="mt-4 text-xs text-gray-500">We use Supabase Auth. No credentials are stored here.</p>
    </div>
  );
}
