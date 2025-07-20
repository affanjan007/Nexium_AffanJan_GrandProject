"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";

// ScrollReveal type for TS
type ScrollRevealFn = () => { reveal: (selector: string, options?: Record<string, unknown>) => void };

export default function CreateRecipePage() {
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
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

  const handleSubmit = async () => {
    setGenerating(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setGenerating(false);
    setSubmitted(true);
  };

  const resetForm = () => {
    setName("");
    setIngredients("");
    setSubmitted(false);
    setGenerating(false);
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-orange-50 via-yellow-50 to-pink-100 flex items-center justify-center p-4 overflow-hidden" data-sr>
      {/* SVG Pattern Overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none"><defs><pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="2" fill="#f59e42" /></pattern></defs><rect width="100%" height="100%" fill="url(#dots)" /></svg>
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8" data-sr>
          <Link href="/" className="inline-flex items-center text-slate-500 hover:text-slate-800 transition-all duration-300 mb-8 group">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mr-3 group-hover:bg-slate-200 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
            <span className="font-medium">Back to Home</span>
          </Link>
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Create Recipe</h1>
            <p className="text-slate-600 text-lg font-light">Let AI craft the perfect recipe for you</p>
          </div>
        </div>

        {/* Recipe Form Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden" data-sr>
          {!isLoggedIn ? (
            <div className="p-8 text-center">
              <div className="mb-4">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-orange-700 mb-2">Sign In Required</h2>
                <p className="text-orange-700 text-sm">Please sign in using the Auth magic link to create a recipe.</p>
              </div>
              <Link href="/test-auth" className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 transition-all duration-300 shadow-lg hover:shadow-xl" data-sr-drop>Go to Login</Link>
            </div>
          ) : !submitted ? (
            <div className="p-8">
              <div className="space-y-8">
                {/* Recipe Name Input */}
                <div className="relative" data-sr>
                  <label className="block text-sm font-semibold text-slate-800 mb-3">
                    Recipe Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-5 py-4 bg-white/60 border border-slate-200/50 rounded-2xl focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-300 placeholder-slate-400 text-slate-800 shadow-sm hover:shadow-md"
                      placeholder="e.g., Spicy Chicken Curry"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 font-medium">Optional - leave blank for surprise recipe</p>
                </div>

                {/* Ingredients Input */}
                <div className="relative" data-sr>
                  <label className="block text-sm font-semibold text-slate-800 mb-3">
                    Ingredients
                  </label>
                  <div className="relative">
                    <textarea
                      value={ingredients}
                      onChange={(e) => setIngredients(e.target.value)}
                      rows={4}
                      className="w-full px-5 py-4 bg-white/60 border border-slate-200/50 rounded-2xl focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-300 placeholder-slate-400 text-slate-800 resize-none shadow-sm hover:shadow-md"
                      placeholder="e.g., chicken, rice, broccoli, garlic"
                    />
                    <div className="absolute top-4 right-4">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 font-medium">Optional - separate with commas</p>
                </div>

                {/* Info Card */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/50 rounded-2xl p-6 shadow-sm" data-sr>
                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-sm text-orange-800">
                      <p className="font-semibold mb-2">Recipe Generation Options:</p>
                      <ul className="text-xs space-y-1.5 font-medium">
                        <li className="flex items-center">
                          <div className="w-1 h-1 bg-orange-500 rounded-full mr-2"></div>
                          Enter both name and ingredients for specific recipe
                        </li>
                        <li className="flex items-center">
                          <div className="w-1 h-1 bg-orange-500 rounded-full mr-2"></div>
                          Enter only ingredients for creative suggestions
                        </li>
                        <li className="flex items-center">
                          <div className="w-1 h-1 bg-orange-500 rounded-full mr-2"></div>
                          Leave both blank for random recipe discovery
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={generating}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 px-6 rounded-2xl font-semibold hover:from-orange-600 hover:to-orange-700 focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                  data-sr-drop
                >
                  {generating ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Recipe...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
                      </svg>
                      Generate Recipe
                    </div>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Recipe Generated!</h2>
                <p className="text-slate-600 font-light">Your AI-powered recipe is ready to cook</p>
              </div>

              <div className="space-y-6">
                {/* Recipe Details */}
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-6 shadow-sm" data-sr>
                  <div className="grid grid-cols-1 gap-4 text-sm">
                    <div className="flex items-center justify-between p-3 bg-white/70 rounded-xl">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </div>
                        <span className="font-semibold text-slate-700">Recipe Name</span>
                      </div>
                      <p className="text-slate-600 font-medium">{name || "Random Recipe"}</p>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/70 rounded-xl">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                        </div>
                        <span className="font-semibold text-slate-700">Ingredients</span>
                      </div>
                      <p className="text-slate-600 font-medium">{ingredients || "Surprise ingredients"}</p>
                    </div>
                  </div>
                </div>

                {/* Status Message */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/50 rounded-2xl p-6 shadow-sm" data-sr>
                  <div className="flex items-center justify-center">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-orange-800 font-medium">
                      Recipe generation feature coming soon! Your preferences have been saved.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4" data-sr-drop>
                  <button
                    onClick={resetForm}
                    className="flex-1 bg-white/70 text-slate-700 py-4 px-6 rounded-2xl font-semibold border border-slate-200/50 hover:bg-white/90 hover:border-slate-300 focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    Create Another
                  </button>
                  <Link
                    href="/saved-recipes"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-2xl font-semibold hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all duration-300 text-center shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    View Saved
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-slate-500 font-medium">
            Powered by AI recipe generation
          </p>
        </div>
      </div>
    </div>
  );
}