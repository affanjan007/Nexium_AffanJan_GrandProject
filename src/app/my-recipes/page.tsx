"use client";

import { useEffect, useState, useMemo } from "react";
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

type SortOption = 'name-asc' | 'name-desc' | 'date-first' | 'date-last';

export default function SavedRecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>('date-last');
  const [deletingRecipe, setDeletingRecipe] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<{ id: string; title: string } | null>(null);

  // Filter and sort recipes
  const filteredAndSortedRecipes = useMemo(() => {
    const filtered = recipes.filter(recipe => {
      const searchLower = searchTerm.toLowerCase();
      const titleMatch = recipe.title.toLowerCase().includes(searchLower);
      const descriptionMatch = recipe.description?.toLowerCase().includes(searchLower) || false;
      const ingredientsMatch = recipe.ingredients?.some(ingredient => 
        ingredient.toLowerCase().includes(searchLower)
      ) || false;
      
      return titleMatch || descriptionMatch || ingredientsMatch;
    });

    // Sort recipes
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.title.localeCompare(b.title);
        case 'name-desc':
          return b.title.localeCompare(a.title);
        case 'date-first':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'date-last':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        default:
          return 0;
      }
    });
  }, [recipes, searchTerm, sortBy]);

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

  const handleDeleteRecipe = async (recipeId: string) => {
    setDeletingRecipe(recipeId);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Remove the recipe from the local state
        setRecipes(recipes.filter(recipe => recipe._id !== recipeId));
        setToastMessage('Recipe deleted successfully! 🗑️');
        setToastType('success');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
      } else {
        setToastMessage('Failed to delete recipe. Please try again.');
        setToastType('error');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
      setToastMessage('Failed to delete recipe. Please try again.');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    } finally {
      setDeletingRecipe(null);
    }
  };

  const openDeleteModal = (recipeId: string, recipeTitle: string) => {
    setRecipeToDelete({ id: recipeId, title: recipeTitle });
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setRecipeToDelete(null);
  };

  const confirmDelete = async () => {
    if (recipeToDelete) {
      await handleDeleteRecipe(recipeToDelete.id);
      closeDeleteModal();
    }
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
          ) : (
            <>
              {/* Filter and Sort Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                {/* Search Input */}
                <div className="w-full sm:w-2/3">
                  <label htmlFor="search" className="sr-only">Search</label>
                  <input
                    type="text"
                    id="search"
                    placeholder="Search by name, description, or ingredients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-md placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                  />
                </div>

                {/* Sort Dropdown */}
                <div className="w-full sm:w-1/3">
                  <label htmlFor="sort" className="sr-only">Sort By</label>
                  <select
                    id="sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                  >
                    <option value="date-last">Last Saved</option>
                    <option value="date-first">First Saved</option>
                    <option value="name-asc">A-Z</option>
                    <option value="name-desc">Z-A</option>
                  </select>
                </div>
              </div>

              {/* Search Results Counter */}
              {searchTerm && (
                <div className="mb-6 flex items-center justify-between bg-orange-50 rounded-xl p-4 border border-orange-200">
                  <p className="text-sm font-medium text-orange-800">
                    Showing {filteredAndSortedRecipes.length} of {recipes.length} recipes
                  </p>
                  <button
                    onClick={() => setSearchTerm("")}
                    className="text-sm text-orange-700 hover:text-orange-900 font-semibold transition-colors bg-white px-3 py-2 rounded-lg border border-orange-300 hover:bg-orange-50"
                  >
                    Clear search
                  </button>
                </div>
              )}

              {filteredAndSortedRecipes.length === 0 ? (
                <div className="text-center py-16" data-sr-drop>
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                    <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-slate-500 text-lg mb-2">
                    {searchTerm ? 'No recipes match your search' : 'No recipes found'}
                  </p>
                  <p className="text-slate-400">
                    {searchTerm ? 'Try adjusting your search terms' : 'Create your first recipe to get started!'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-6" data-sr>
                  {filteredAndSortedRecipes.map((recipe, idx) => (
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
                                                <div className="flex items-center space-x-2">
                        <button
                          className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors duration-200"
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
                        <button
                          className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors duration-200 border border-red-200 hover:border-red-300"
                          onClick={() => openDeleteModal(recipe._id || '', recipe.title)}
                          disabled={deletingRecipe === recipe._id}
                        >
                          {deletingRecipe === recipe._id ? (
                            <div className="flex items-center">
                              <svg className="animate-spin w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Deleting...
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </div>
                          )}
                        </button>
                      </div>
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
            </>
          )}
        </div>
      </div>

      {/* Modern Toast Notification Modal */}
      {showToast && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`max-w-md w-full bg-white rounded-3xl shadow-2xl border-l-4 ${
            toastType === 'success' 
              ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50' 
              : 'border-red-500 bg-gradient-to-r from-red-50 to-pink-50'
          } p-6 animate-in zoom-in-95 duration-300`}>
            <div className="text-center">
              {/* Icon */}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                toastType === 'success' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {toastType === 'success' ? (
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              
              {/* Message */}
              <h3 className={`text-lg font-bold mb-2 ${
                toastType === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {toastType === 'success' ? 'Success!' : 'Error'}
              </h3>
              <p className={`text-sm mb-6 ${
                toastType === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
                {toastMessage}
              </p>
              
              {/* Action Button */}
              <button
                onClick={() => setShowToast(false)}
                className={`px-6 py-3 rounded-xl font-semibold transition-colors duration-200 ${
                  toastType === 'success' 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && recipeToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-300">
            <div className="text-center">
              {/* Warning Icon */}
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Delete Recipe
              </h3>
              
              {/* Message */}
              <p className="text-slate-600 mb-6">
                Are you sure you want to delete <span className="font-semibold text-slate-900">&ldquo;{recipeToDelete.title}&rdquo;</span>? 
                <br />
                <span className="text-sm text-slate-500">This action cannot be undone.</span>
              </p>
              
              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={closeDeleteModal}
                  className="flex-1 px-4 py-3 text-slate-700 bg-slate-100 rounded-xl font-semibold hover:bg-slate-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deletingRecipe === recipeToDelete.id}
                  className="flex-1 px-4 py-3 text-white bg-red-600 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {deletingRecipe === recipeToDelete.id ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </div>
                  ) : (
                    'Delete Recipe'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}