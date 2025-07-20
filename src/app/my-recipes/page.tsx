"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from '@/lib/supabase-client';

interface Recipe {
  _id?: string;
  title: string;
  description?: string;
  createdAt?: string;
  ingredients?: string[];
  steps?: string[];
}

// ScrollReveal type for TS
type ScrollRevealFn = () => { reveal: (selector: string, options?: Record<string, unknown>) => void };

export default function SavedRecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        const res = await fetch("/api/recipes", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const dataRes = await res.json();
        if (dataRes.success) {
          setRecipes(dataRes.recipes);
        } else {
          setError("Failed to fetch recipes.");
        }
      } catch {
        setError("Error fetching recipes.");
      } finally {
        setLoading(false);
      }
    };
    fetchRecipes();
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

  const toggleExpand = (idx: number) => {
    setExpanded(expanded === idx ? null : idx);
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 overflow-hidden" data-sr>
      {/* SVG Pattern Overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none"><defs><pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="2" fill="#10b981" /></pattern></defs><rect width="100%" height="100%" fill="url(#dots)" /></svg>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-center justify-between" data-sr>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">My Recipes</h1>
              <p className="text-slate-600">Your saved culinary creations</p>
            </div>
            <Link href="/" className="inline-flex items-center text-slate-600 hover:text-slate-900 font-medium transition-colors">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-16" data-sr-drop>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                <svg className="animate-spin w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-slate-600 text-lg">Loading your recipes...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16" data-sr-drop>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-red-600 text-lg">{error}</p>
            </div>
          ) : recipes.length === 0 ? (
            <div className="text-center py-16" data-sr-drop>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="text-slate-500 text-lg mb-2">No recipes found</p>
              <p className="text-slate-400">Create your first recipe to get started!</p>
            </div>
          ) : (
            <div className="grid gap-6" data-sr>
              {recipes.map((recipe, idx) => (
                <div key={recipe._id || idx} className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow duration-300" data-sr-drop>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">{recipe.title}</h2>
                        {recipe.description && (
                          <p className="text-slate-600 mb-3">{recipe.description}</p>
                        )}
                        {recipe.createdAt && (
                          <div className="flex items-center text-sm text-slate-500">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {new Date(recipe.createdAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <button
                        className="ml-4 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors duration-200"
                        onClick={() => toggleExpand(idx)}
                      >
                        {expanded === idx ? (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                            Hide Details
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            Show Details
                          </div>
                        )}
                      </button>
                    </div>

                    {expanded === idx && (
                      <div className="border-t border-slate-200 pt-6 mt-6 space-y-6">
                        {recipe.ingredients && recipe.ingredients.length > 0 && (
                          <div>
                            <div className="flex items-center mb-3">
                              <svg className="w-5 h-5 text-slate-700 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              <h3 className="font-semibold text-slate-900 text-lg">Ingredients</h3>
                            </div>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {recipe.ingredients.map((ing: string, i: number) => (
                                <li key={i} className="flex items-center text-slate-700">
                                  <span className="w-2 h-2 bg-slate-400 rounded-full mr-3 flex-shrink-0"></span>
                                  {ing}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {recipe.steps && recipe.steps.length > 0 && (
                          <div>
                            <div className="flex items-center mb-3">
                              <svg className="w-5 h-5 text-slate-700 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <h3 className="font-semibold text-slate-900 text-lg">Instructions</h3>
                            </div>
                            <ol className="space-y-3">
                              {recipe.steps.map((step: string, i: number) => (
                                <li key={i} className="flex items-start">
                                  <span className="flex-shrink-0 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                                    {i + 1}
                                  </span>
                                  <span className="text-slate-700">{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}