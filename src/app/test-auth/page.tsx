'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { User } from '@supabase/supabase-js';

type ScrollRevealFn = () => { reveal: (selector: string, options?: Record<string, unknown>) => void };

export default function TestAuthPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [session, setSession] = useState<{ user: User } | null>(null);
  const [jwtToken, setJwtToken] = useState('');

  useEffect(() => {
    checkSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session?.access_token) {
        setJwtToken(session.access_token);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const loadScrollReveal = async () => {
      if (typeof window !== 'undefined') {
        if (!(window as unknown as { ScrollReveal?: ScrollRevealFn }).ScrollReveal) {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/scrollreveal';
          script.async = true;
          script.onload = () => {
            animateSections();
          };
          document.body.appendChild(script);
        } else {
          animateSections();
        }
      }
    };
    function animateSections() {
      if (!(window as unknown as { ScrollReveal?: ScrollRevealFn }).ScrollReveal) return;
      (window.ScrollReveal as ScrollRevealFn)().reveal('[data-sr]', {
        distance: '40px',
        duration: 1500,
        easing: 'cubic-bezier(0.5, 0, 0, 1)',
        origin: 'bottom',
        interval: 120,
        opacity: 0,
        reset: false,
        cleanup: true,
      });
      (window.ScrollReveal as ScrollRevealFn)().reveal('[data-sr-drop]', {
        distance: '120px',
        duration: 1800,
        origin: 'top',
        opacity: 0,
        reset: false,
        cleanup: true,
      });
    }
    loadScrollReveal();
  }, []);

  const checkSession = async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    if (data.session?.access_token) {
      setJwtToken(data.session.access_token);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/test-auth`
        }
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('Check your email for the magic link! Click the link to sign in.');
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setJwtToken('');
    setMessage('Signed out successfully');
  };

  const testApiCall = async () => {
    if (!jwtToken) {
      setMessage('No JWT token available');
      return;
    }

    try {
      const response = await fetch('/api/auth', {
        headers: {
          'Authorization': `Bearer ${jwtToken}`
        }
      });
      
      const data = await response.json();
      setMessage(`API Response: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setMessage(`API Error: ${error}`);
    }
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-hidden" data-sr>
      {/* SVG Pattern Overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none"><defs><pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="2" fill="#6366f1" /></pattern></defs><rect width="100%" height="100%" fill="url(#dots)" /></svg>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6" data-sr>
            <Link
              href="/"
              className="inline-flex items-center text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
          </div>

          <div className="text-center mb-8" data-sr>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Authentication Test
            </h1>
            <p className="text-slate-600">
              Test Supabase magic link authentication and API endpoints
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden" data-sr>
            {!session ? (
              <div className="p-8">
                <div className="text-center mb-8" data-sr>
                  <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-semibold text-slate-900 mb-2">Sign In</h2>
                  <p className="text-slate-600">Enter your email to receive a magic link</p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-6" data-sr-drop>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-colors bg-slate-50"
                      placeholder="you@example.com"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 text-white py-3 px-4 rounded-xl font-medium hover:bg-slate-800 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending Magic Link...
                      </div>
                    ) : (
                      'Send Magic Link'
                    )}
                  </button>
                </form>

                <div className="mt-8 p-6 bg-slate-50 rounded-xl" data-sr>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">How to Test:</h3>
                  <ol className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">1</span>
                      Enter your email address above and click Send Magic Link
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">2</span>
                      Check your email inbox for the Magic Link
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">3</span>
                      Click the Magic Link to sign in automatically
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">4</span>
                      Once signed in, you can test API calls
                    </li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="p-8">
                <div className="text-center mb-8" data-sr>
                  <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-semibold text-slate-900 mb-2">Welcome!</h2>
                  <p className="text-slate-600">{session.user.email}</p>
                  <div className="mt-2 text-xs text-slate-500">User ID: <span className="font-mono break-all">{session.user.id}</span></div>
                </div>

                <div className="grid grid-cols-1 gap-4 mb-6" data-sr-drop>
                  <button
                    onClick={testApiCall}
                    className="bg-green-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                  >
                    Test API Call
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="bg-slate-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-slate-700 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>

                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200" data-sr>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">API Testing</h3>
                  <p className="text-sm text-slate-800 mb-3">
                    Use your JWT token to test the API endpoints:
                  </p>
                  <div className="space-y-2 text-sm">
                    <code className="block bg-blue-100 text-blue-800 p-2 rounded text-xs">
                      curl -H &quot;Authorization: Bearer [TOKEN]&quot; http://localhost:3000/api/auth
                    </code>
                    <code className="block bg-blue-100 text-blue-800 p-2 rounded text-xs">
                      curl -H &quot;Authorization: Bearer [TOKEN]&quot; http://localhost:3000/api/recipes
                    </code>
                  </div>
                </div>
              </div>
            )}

            {message && (
              <div className={`px-8 pb-6 ${session ? 'pt-0' : ''}`} data-sr-drop>
                <div className={`p-4 rounded-xl border ${
                  message.includes('Error') 
                    ? 'bg-red-50 border-red-200 text-red-800' 
                    : 'bg-green-50 border-green-200 text-green-800'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}