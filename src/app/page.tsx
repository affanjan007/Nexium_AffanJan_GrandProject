"use client";
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';

declare global { interface Window { ScrollReveal?: unknown; } }

type ScrollRevealFn = () => { reveal: (selector: string, options?: Record<string, unknown>) => void };

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showScrollUp, setShowScrollUp] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(true);

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
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      setShowScrollUp(scrollY > 10);
      setShowScrollDown(scrollY + windowHeight < docHeight - 10);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- ScrollReveal Animation ---
  useEffect(() => {
    const loadScrollReveal = async () => {
      if (typeof window !== 'undefined') {
        // Dynamically load ScrollReveal from CDN
        if (!window.ScrollReveal) {
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
      if (!window.ScrollReveal) return;
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
      // Animate feature boxes from left and right
      (window.ScrollReveal as ScrollRevealFn)().reveal('[data-sr-left]', {
        distance: '60px',
        duration: 1500,
        easing: 'cubic-bezier(0.5, 0, 0, 1)',
        origin: 'left',
        opacity: 0,
        interval: 120,
        reset: false,
        cleanup: true,
      });
      (window.ScrollReveal as ScrollRevealFn)().reveal('[data-sr-right]', {
        distance: '60px',
        duration: 1500,
        easing: 'cubic-bezier(0.5, 0, 0, 1)',
        origin: 'right',
        opacity: 0,
        interval: 120,
        reset: false,
        cleanup: true,
      });
      (window.ScrollReveal as ScrollRevealFn)().reveal('[data-sr-top]', {
        distance: '60px',
        duration: 1500,
        easing: 'cubic-bezier(0.5, 0, 0, 1)',
        origin: 'top',
        opacity: 0,
        interval: 120,
        reset: false,
        cleanup: true,
      });
      (window.ScrollReveal as ScrollRevealFn)().reveal('[data-sr-drop]', {
        distance: '80px',
        duration: 1500,
        easing: 'cubic-bezier(0.5, 0, 0, 1)',
        origin: 'top',
        opacity: 0,
        interval: 120,
        reset: false,
        cleanup: true,
      });
    }
    loadScrollReveal();
  }, []);
  // --- End ScrollReveal ---

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Modern Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Recipe AI
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              <Link
                href="/"
                className="px-4 py-2 rounded-full text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 font-medium"
              >
                Home
              </Link>
              <Link
                href="/create-recipe"
                className="px-4 py-2 rounded-full text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-200 font-medium"
              >
                Create Recipe
              </Link>
              <Link
                href="/my-recipes"
                className="px-4 py-2 rounded-full text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 font-medium"
              >
                My Recipes
              </Link>
              {isLoggedIn ? (
                <button
                  onClick={handleSignOut}
                  className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white font-medium rounded-full hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-red-500/25 hover:scale-105 ml-4"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/test-auth"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-full hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-blue-500/25 hover:scale-105 ml-4"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header data-sr className="relative overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-emerald-600/10 blur-3xl"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            <div data-sr className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-8 animate-fade-in">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
              AI-Powered Recipe Generator
            </div>
            
            <h1 data-sr className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-emerald-700 dark:from-white dark:via-blue-200 dark:to-emerald-300 bg-clip-text text-transparent mb-6 animate-fade-in">
              Create Amazing Recipes
            </h1>
            
            <p data-sr className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8 animate-fade-in">
              Transform your ingredients into culinary masterpieces with AI-powered recipe generation
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in">
              <div data-sr-drop>
                <Link
                  href="/create-recipe"
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-full hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-105"
                >
                  Start Creating Recipes
                </Link>
              </div>
              {!isLoggedIn && (
                <div data-sr-drop>
                  <Link
                    href="/test-auth"
                    className="px-8 py-3 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-semibold rounded-full border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-300 shadow-lg hover:shadow-lg hover:scale-105"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>

            {/* Auth Notice */}
            {!isLoggedIn && (
              <div className="max-w-md mx-auto mb-12 animate-fade-in">
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                      <span className="font-semibold">Sign in required</span> to create and save recipes
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* How It Works Section */}
      <section data-sr className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 data-sr className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            How It Works
          </h2>
          <p data-sr className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Creating delicious recipes with AI has never been easier. Just follow these simple steps.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div data-sr-left className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <span className="text-2xl font-bold text-white">1</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Add Your Ingredients
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Simply list the ingredients you have available in your kitchen
            </p>
          </div>

          <div data-sr-top className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <span className="text-2xl font-bold text-white">2</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              AI Magic Happens
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Our advanced AI analyzes your ingredients and creates personalized recipes
            </p>
          </div>

          <div data-sr-right className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <span className="text-2xl font-bold text-white">3</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Cook & Enjoy
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Follow the detailed instructions and create your culinary masterpiece
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section data-sr className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 data-sr className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Why Choose Recipe AI?
          </h2>
          <p data-sr className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Discover the features that make our AI recipe generator the perfect cooking companion.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div data-sr-left className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Lightning Fast
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Generate recipes in seconds with our optimized AI algorithms
            </p>
          </div>

          <div data-sr-right className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Personalized
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Recipes tailored to your taste preferences and dietary requirements
            </p>
          </div>

          <div data-sr-left className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Save & Organize
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Keep all your favorite recipes organized in your personal collection
            </p>
          </div>

          <div data-sr-right className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Time Estimates
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Get accurate cooking and prep time estimates for better meal planning
            </p>
          </div>

          <div data-sr-left className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Nutrition Info
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Get detailed nutritional information for every recipe you create
            </p>
          </div>

          <div data-sr-right className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Global Cuisines
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Explore recipes from cuisines around the world with authentic flavors
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section  */}
      <div data-sr>
        <StatsSection />
      </div>

      {/* Scroll Buttons */}
      <div className="fixed bottom-32 right-8 flex flex-col space-y-3 z-50">
        {showScrollUp && (
          <button
            aria-label="Scroll Up"
            onClick={() => window.scrollBy({ top: -window.innerHeight, behavior: 'smooth' })}
            className="bg-white/80 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-full shadow-lg p-3 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
          >
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        )}
        {showScrollDown && (
          <button
            aria-label="Scroll Down"
            onClick={() => window.scrollBy({ top: window.innerHeight, behavior: 'smooth' })}
            className="bg-white/80 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-full shadow-lg p-3 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
          >
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Floating Elements */}
      <div className="fixed top-20 left-10 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-float"></div>
      <div className="fixed bottom-20 right-10 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }}></div>
      <div className="fixed top-1/2 right-20 w-16 h-16 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
    </main>
  );
}

function StatsSection() {
  const [recipes, setRecipes] = useState(0);
  const [cooks, setCooks] = useState(0);
  const [cuisines, setCuisines] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sectionRef.current;
    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.3 }
    );
    if (node) {
      observer.observe(node);
    }
    return () => {
      if (node) observer.unobserve(node);
    };
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated) return;
    const animateCount = (target: number, setter: (val: number) => void, speed = 50) => {
      let current = 0;
      const step = Math.ceil(target / 40);
      const interval = setInterval(() => {
        current += step;
        if (current >= target) {
          current = target;
          clearInterval(interval);
        }
        setter(current);
      }, speed);
    };
    animateCount(1000, setRecipes, 50);
    animateCount(500, setCooks, 50);
    animateCount(50, setCuisines, 50);
  }, [hasAnimated]);

  return (
    <section ref={sectionRef} className="max-w-5xl mx-auto px-4 py-20">
      <div className="relative rounded-3xl bg-white/10 dark:bg-slate-900/60 backdrop-blur-xl border border-white/30 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-emerald-400/30 to-cyan-400/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-gradient-to-br from-cyan-400/20 to-emerald-400/10 rounded-full blur-2xl"></div>
        </div>
        <div className="relative z-10 px-8 py-14 md:py-20 flex flex-col items-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2 text-center tracking-tight drop-shadow-lg">
            Trusted by Food Enthusiasts
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-200 mb-12 text-center max-w-2xl">
            Join thousands of home cooks who are already creating amazing recipes with our AI
          </p>
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Recipes Generated */}
            <div className="flex flex-col items-center justify-center">
              <div className="mb-3 flex items-center justify-center">
                <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-emerald-400 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </span>
              </div>
              <div className="text-5xl font-extrabold bg-gradient-to-r from-blue-500 via-emerald-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg mb-1">
                {recipes.toLocaleString()}+
              </div>
              <div className="text-base font-medium text-gray-700 dark:text-gray-200 opacity-90">Recipes Generated</div>
            </div>
            {/* Happy Cooks */}
            <div className="flex flex-col items-center justify-center">
              <div className="mb-3 flex items-center justify-center">
                <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-400 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
              </div>
              <div className="text-5xl font-extrabold bg-gradient-to-r from-pink-500 via-purple-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg mb-1">
                {cooks}+
              </div>
              <div className="text-base font-medium text-gray-700 dark:text-gray-200 opacity-90">Happy Cooks</div>
            </div>
            {/* Cuisines Covered */}
            <div className="flex flex-col items-center justify-center">
              <div className="mb-3 flex items-center justify-center">
                <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </span>
              </div>
              <div className="text-5xl font-extrabold bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg mb-1">
                {cuisines}+
              </div>
              <div className="text-base font-medium text-gray-700 dark:text-gray-200 opacity-90">Cuisines Covered</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}