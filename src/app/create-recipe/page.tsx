"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import { triggerN8nWebhook } from "@/n8n/client";
import ReactMarkdown from 'react-markdown';
import { List, ChefHat, Lightbulb, Clipboard } from "lucide-react"; 

type ScrollRevealFn = () => { reveal: (selector: string, options?: Record<string, unknown>) => void };

function parseRecipeSections(markdown: string) {
  const cleanMarkdown = markdown
    .replace(/#{1,6}\s*/g, '') 
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1') 
    .trim();

  const lines = cleanMarkdown.split('\n').filter(line => line.trim());
  const titleMatch = lines[0] || 'Generated Recipe';
  const title = titleMatch.replace(/[*#]/g, '').trim();

  const ingredientsMatch = cleanMarkdown.match(/ingredients?[:\s]*([\s\S]*?)(?:\n\d+\.|\n*instructions?|\n*steps?|\n*nutritional|\n*tips?|$)/i);
  const ingredients = ingredientsMatch
    ? parseList(ingredientsMatch[1])
    : [];

  const stepsMatch = cleanMarkdown.match(/(?:instructions?|steps?)[:\s]*([\s\S]*?)(?:\n*nutritional|\n*tips?|$)/i);
  const steps = stepsMatch
    ? parseSteps(stepsMatch[1])
    : [];

  const nutritionMatch = cleanMarkdown.match(/nutritional information[:\s]*([\s\S]*?)(?:\n*tips?|$)/i);
  const nutrition = nutritionMatch
    ? parseNutrition(nutritionMatch[1])
    : { calories: 0, weight: 0, protein: 0, carbohydrates: 0, fats: 0 };

  const tipsMatch = cleanMarkdown.match(/tips?[:\s]*([\s\S]*)/i);
  const tips = tipsMatch
    ? parseList(tipsMatch[1])
    : [];

  return { title, ingredients, steps, tips, nutrition };
}

function parseList(text: string): string[] {
  return text
    .split(/\n|•|-/)
    .map(line => line.replace(/^[*-]?\s?/, '').replace(/[*#]/g, '').trim()) // Remove markdown formatting
    .filter(line =>
      !!line && 
      !/^[*#]+$/.test(line) && 
      !/^[\s]*$/.test(line) && 
      !/^(ingredients?|instructions?|steps?|tips?|servings?|prep time|cook time|total time)[:\s]*$/i.test(line)
    );
}

function parseSteps(text: string): string[] {
  let steps = text
    .split(/\n\d+\.\s*|\n(?=\d+\.\s*)|^\d+\.\s*/gm)
    .map(step => step.replace(/^\d+\.\s*/, '').replace(/[*#]/g, '').trim()) 
    .filter(step =>
      step.length > 0 &&
      !/^(instructions?|steps?|tips?)[:\s]*$/i.test(step)
    );

  if (steps.length <= 1) {
    steps = text
      .split(/\n\n|\. (?=[A-Z])/)
      .map(step => step.replace(/[*#]/g, '').trim()) 
      .filter(step => step.length > 10);
  }

  return steps;
}

function parseNutrition(text: string): { calories: number; weight: number; protein: number; carbohydrates: number; fats: number } {
  const lines = text.split('\n').map(line => line.toLowerCase().trim());
  
  let calories = 0;
  let weight = 0;
  let protein = 0;
  let carbohydrates = 0;
  let fats = 0;

  lines.forEach(line => {
    // Extract calories - multiple patterns
    const caloriesMatch = line.match(/(?:calories?|kcal|energy)[:\s]*(\d+)/i);
    if (caloriesMatch) {
      calories = parseInt(caloriesMatch[1]);
    }

    // Extract weight - multiple patterns
    const weightMatch = line.match(/(?:weight|serving size|portion)[:\s]*(\d+(?:\.\d+)?)/i);
    if (weightMatch) {
      weight = parseFloat(weightMatch[1]);
    }

    // Extract protein - multiple patterns
    const proteinMatch = line.match(/(?:protein|proteins)[:\s]*(\d+(?:\.\d+)?)/i);
    if (proteinMatch) {
      protein = parseFloat(proteinMatch[1]);
    }

    // Extract carbohydrates - multiple patterns
    const carbsMatch = line.match(/(?:carbohydrates?|carbs|carb)[:\s]*(\d+(?:\.\d+)?)/i);
    if (carbsMatch) {
      carbohydrates = parseFloat(carbsMatch[1]);
    }

    // Extract fats - multiple patterns
    const fatsMatch = line.match(/(?:fats?|fat|lipids)[:\s]*(\d+(?:\.\d+)?)/i);
    if (fatsMatch) {
      fats = parseFloat(fatsMatch[1]);
    }
  });

  // If no nutrition data found, try to predict based on common patterns
  if (calories === 0 && weight === 0 && protein === 0 && carbohydrates === 0 && fats === 0) {
    return predictNutrition(text);
  }

  // Fill missing values with reasonable estimates
  if (calories === 0) {
    calories = Math.round((protein * 4) + (carbohydrates * 4) + (fats * 9));
  }
  if (weight === 0) {
    weight = Math.round(calories / 2); // Rough estimate: 2 calories per gram
  }
  if (protein === 0) {
    protein = Math.round(calories * 0.15 / 4); // 15% of calories from protein
  }
  if (carbohydrates === 0) {
    carbohydrates = Math.round(calories * 0.55 / 4); // 55% of calories from carbs
  }
  if (fats === 0) {
    fats = Math.round(calories * 0.30 / 9); // 30% of calories from fat
  }

  return { calories, weight, protein, carbohydrates, fats };
}

function predictNutrition(text: string): { calories: number; weight: number; protein: number; carbohydrates: number; fats: number } {
  const lowerText = text.toLowerCase();
  
  // Calculate total weight from ingredients
  let totalWeight = 0;
  const weightMatches = text.match(/(\d+(?:\.\d+)?)\s*(g|gram|grams|kg|kilo|kilos)/gi);
  if (weightMatches) {
    weightMatches.forEach(match => {
      const num = parseFloat(match.replace(/[^\d.]/g, ''));
      const unit = match.toLowerCase().replace(/[\d.]/g, '').trim();
      if (unit.includes('kg') || unit.includes('kilo')) {
        totalWeight += num * 1000;
      } else {
        totalWeight += num;
      }
    });
  }

  // Estimate based on recipe type and ingredients
  let estimatedCalories = 300; // Default moderate meal
  let estimatedProtein = 15;
  let estimatedCarbs = 30;
  let estimatedFats = 12;

  // Adjust based on recipe keywords
  if (lowerText.includes('salad') || lowerText.includes('vegetable')) {
    estimatedCalories = 150;
    estimatedProtein = 8;
    estimatedCarbs = 20;
    estimatedFats = 5;
  } else if (lowerText.includes('pasta') || lowerText.includes('rice') || lowerText.includes('noodle')) {
    estimatedCalories = 400;
    estimatedProtein = 12;
    estimatedCarbs = 60;
    estimatedFats = 8;
  } else if (lowerText.includes('meat') || lowerText.includes('chicken') || lowerText.includes('beef') || lowerText.includes('pork')) {
    estimatedCalories = 350;
    estimatedProtein = 25;
    estimatedCarbs = 15;
    estimatedFats = 15;
  } else if (lowerText.includes('fish') || lowerText.includes('salmon') || lowerText.includes('tuna')) {
    estimatedCalories = 250;
    estimatedProtein = 20;
    estimatedCarbs = 5;
    estimatedFats = 12;
  } else if (lowerText.includes('soup') || lowerText.includes('stew')) {
    estimatedCalories = 200;
    estimatedProtein = 10;
    estimatedCarbs = 25;
    estimatedFats = 8;
  } else if (lowerText.includes('dessert') || lowerText.includes('cake') || lowerText.includes('cookie') || lowerText.includes('sweet')) {
    estimatedCalories = 350;
    estimatedProtein = 5;
    estimatedCarbs = 45;
    estimatedFats = 15;
  } else if (lowerText.includes('breakfast') || lowerText.includes('egg') || lowerText.includes('pancake')) {
    estimatedCalories = 300;
    estimatedProtein = 15;
    estimatedCarbs = 25;
    estimatedFats = 12;
  }

  // If we found ingredient weights, use them for better estimates
  if (totalWeight > 0) {
    // Scale calories based on total weight
    estimatedCalories = Math.round(totalWeight * 1.5); // Rough estimate: 1.5 cal per gram
    estimatedProtein = Math.round(totalWeight * 0.1); // 10% of weight as protein
    estimatedCarbs = Math.round(totalWeight * 0.15); // 15% of weight as carbs
    estimatedFats = Math.round(totalWeight * 0.05); // 5% of weight as fat
  } else {
    // Fallback to recipe type estimates
    totalWeight = estimatedCalories / 1.5; // Reverse calculation
  }

  return {
    calories: estimatedCalories,
    weight: Math.round(totalWeight),
    protein: estimatedProtein,
    carbohydrates: estimatedCarbs,
    fats: estimatedFats
  };
}

export default function CreateRecipePage() {
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState("");
  const [showIngredients, setShowIngredients] = useState(true);
  const [showSteps, setShowSteps] = useState(true);
  const [showTips, setShowTips] = useState(true);
  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [loadingProgress, setLoadingProgress] = useState(0);


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
    setLoadingProgress(0);
    
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      const n8nWebhookUrl = "http://localhost:5678/webhook/recipe";
      const payload = { name, ingredients };
      const result = await triggerN8nWebhook({
        url: n8nWebhookUrl,
        method: "POST",
        payload,
      });
      if (result.text) {
        setLoadingProgress(100);
        setTimeout(() => {
          setGeneratedRecipe(result.text);
          setSubmitted(true);
          setGenerating(false);
          setLoadingProgress(0);
        }, 500);
        clearInterval(progressInterval);
        return;
      }
      throw new Error("n8n did not return a recipe");
    } catch {
      try {
        const response = await fetch('/api/generate-recipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, ingredients }),
        });
        const data = await response.json();
        if (data.text) {
          setLoadingProgress(100);
          setTimeout(() => {
            setGeneratedRecipe(data.text);
            setSubmitted(true);
            setGenerating(false);
            setLoadingProgress(0);
          }, 500);
        } else {
          setGeneratedRecipe("Failed to generate recipe from both n8n and Gemini API.");
          setGenerating(false);
          setLoadingProgress(0);
        }
      } catch {
        setGeneratedRecipe("Failed to generate recipe from both n8n and Gemini API.");
        setGenerating(false);
        setLoadingProgress(0);
      }
    }
    clearInterval(progressInterval);
  };

  const handleSaveRecipe = async () => {
    if (!isLoggedIn) {
      setToastMessage('You must be logged in to save recipes.');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      if (!userId) {
        setToastMessage('Failed to save recipe: User ID not found.');
        setToastType('error');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
        return;
      }

      const response = await fetch('/api/save-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: name || 'Random Recipe',
          ingredients: ingredients || 'Surprise ingredients',
          content: generatedRecipe,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setToastMessage('Recipe saved successfully! 🎉');
        setToastType('success');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
      } else {
        setToastMessage('Failed to save recipe: ' + (data.error || 'Unknown error'));
        setToastType('error');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      setToastMessage('Failed to save recipe: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }
  };

  const resetForm = () => {
    setName("");
    setIngredients("");
    setSubmitted(false);
    setGenerating(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  type ParsedRecipe = {
    title: string;
    ingredients: string[];
    steps: string[];
    tips: string[];
    nutrition: {
      calories: number;
      weight: number;
      protein: number;
      carbohydrates: number;
      fats: number;
    };
  };

  let parsed: ParsedRecipe = {
    title: '',
    ingredients: [],
    steps: [],
    tips: [],
    nutrition: { calories: 0, weight: 0, protein: 0, carbohydrates: 0, fats: 0 },
  };

  try {
    parsed = parseRecipeSections(generatedRecipe);
  } catch {}

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-orange-50 via-yellow-50 to-pink-100 flex items-center justify-center p-4 overflow-hidden" data-sr>
      {/* SVG Pattern Overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none"><defs><pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="2" fill="#f59e42" /></pattern></defs><rect width="100%" height="100%" fill="url(#dots)" /></svg>
      <div className="w-full max-w-6xl p-12">
        {/* Header */}
        <div className="text-center mb-8" data-sr>
          <Link href="/" className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-all duration-300 mb-8 group">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center mr-3 group-hover:bg-slate-300 transition-colors">
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
                  <p className="text-xs text-slate-600 mt-2 font-medium">Optional - leave blank for surprise recipe</p>
                </div>

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
                  <p className="text-xs text-slate-600 mt-2 font-medium">Optional - separate with commas</p>
                </div>

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

                <button
                  onClick={handleSubmit}
                  disabled={generating}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 px-6 rounded-2xl font-semibold hover:from-orange-600 hover:to-orange-700 focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                  data-sr-drop
                >
                  {generating ? (
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex items-center justify-center mb-3">
                        <div className="relative">
                          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <div className="absolute inset-0 w-8 h-8 border-4 border-transparent border-r-white/60 rounded-full animate-pulse"></div>
                        </div>
                        <div className="ml-3 flex space-x-1">
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                      
                      <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                        <div 
                          className="bg-white h-2 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${loadingProgress}%` }}
                        ></div>
                      </div>
                      
                      <div className="text-sm font-medium">
                        {loadingProgress < 30 ? "Gathering ingredients..." :
                         loadingProgress < 60 ? "Crafting recipe..." :
                         loadingProgress < 90 ? "Adding final touches..." :
                         "Almost ready..."}
                      </div>
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
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-6 shadow-sm" data-sr>
                  <div className="grid grid-cols-1 gap-4 text-sm">
                    <div className="flex items-center justify-between p-3 bg-white/70 rounded-xl">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </div>
                        <span className="font-semibold text-slate-800">Recipe Name</span>
                      </div>
                      <p className="text-slate-700 font-medium">{name || "Random Recipe"}</p>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/70 rounded-xl">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                        </div>
                        <span className="font-semibold text-slate-800">Ingredients</span>
                      </div>
                      <p className="text-slate-700 font-medium">{ingredients || "Surprise ingredients"}</p>
                    </div>
                  </div>
                </div>
                {submitted && (
                  <div className="bg-white/90 rounded-2xl p-6 shadow-md mt-4 prose max-w-none prose-headings:text-orange-700 prose-p:text-slate-900 prose-li:text-slate-900 prose-strong:text-slate-900">
                    <h2 className="flex items-center gap-2 text-2xl font-bold text-orange-700 mb-4">
                      <ChefHat className="w-7 h-7 text-orange-500" /> {parsed.title || 'Generated Recipe'}
                    </h2>
                    <div className="mb-6">
                      <button onClick={() => setShowIngredients(v => !v)} className="flex items-center gap-2 text-xl font-semibold text-green-700 mb-2">
                        <List className="w-5 h-5 text-green-500" /> Ingredients
                        <span className="ml-2 text-xs text-slate-600">{showIngredients ? 'Hide' : 'Show'}</span>
                      </button>
                      {showIngredients && (
                        <div>
                          <button onClick={() => handleCopy(parsed.ingredients.join('\n'))} className="mb-2 flex items-center gap-1 text-xs text-blue-600 hover:underline"><Clipboard className="w-4 h-4" /> Copy Ingredients</button>
                          <ul>
                            {parsed.ingredients.length > 0 ? parsed.ingredients.map((ing, i) => (
                              <li key={i} className="text-slate-800">{ing}</li>
                            )) : <li className="text-slate-500">No ingredients found.</li>}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="mb-6">
                      <button onClick={() => setShowSteps(v => !v)} className="flex items-center gap-2 text-xl font-semibold text-blue-700 mb-2">
                        <ChefHat className="w-5 h-5 text-blue-500" /> Instructions
                        <span className="ml-2 text-xs text-slate-600">{showSteps ? 'Hide' : 'Show'}</span>
                      </button>
                      {showSteps && (
                        <div>
                          <button onClick={() => handleCopy(parsed.steps.join('\n'))} className="mb-2 flex items-center gap-1 text-xs text-blue-600 hover:underline"><Clipboard className="w-4 h-4" /> Copy Steps</button>
                          <ol className="list-decimal ml-6">
                            {parsed.steps.length > 0 ? parsed.steps.map((step, i) => (
                              <li key={i} className="flex items-start gap-2 text-slate-800 mb-2">
                                <input type="checkbox" checked={checkedSteps.includes(i)} onChange={() => setCheckedSteps(cs => cs.includes(i) ? cs.filter(x => x !== i) : [...cs, i])} className="mr-2 mt-1 flex-shrink-0" />
                                <span>{step}</span>
                              </li>
                            )) : <li className="text-slate-500">No steps found.</li>}
                          </ol>
                        </div>
                      )}
                    </div>

                    {/* Nutrition Information */}
                    <div className="mb-6">
                      <div className="mb-4">
                        <div className="flex items-center gap-2 text-xl font-semibold text-purple-700 mb-2">
                          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Nutritional Information (for total dish)
                        </div>
                        <div className="text-sm text-purple-600 font-medium italic">
                          NOTE: These values may vary depending on the way dish is prepared
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 text-center border border-red-200">
                          <div className="text-2xl font-bold text-red-600">{parsed.nutrition.calories}</div>
                          <div className="text-sm text-red-700 font-medium">Calories</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center border border-purple-200">
                          <div className="text-2xl font-bold text-purple-600">{parsed.nutrition.weight}g</div>
                          <div className="text-sm text-purple-700 font-medium">Weight</div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-blue-200">
                          <div className="text-2xl font-bold text-blue-600">{parsed.nutrition.protein}g</div>
                          <div className="text-sm text-blue-700 font-medium">Protein</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center border border-green-200">
                          <div className="text-2xl font-bold text-green-600">{parsed.nutrition.carbohydrates}g</div>
                          <div className="text-sm text-green-700 font-medium">Carbs</div>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 text-center border border-yellow-200">
                          <div className="text-2xl font-bold text-yellow-600">{parsed.nutrition.fats}g</div>
                          <div className="text-sm text-yellow-700 font-medium">Fats</div>
                        </div>
                      </div>
                    </div>
                    {parsed.tips.length > 0 && (
                      <div className="mb-6">
                        <button onClick={() => setShowTips(v => !v)} className="flex items-center gap-2 text-xl font-semibold text-yellow-700 mb-2">
                          <Lightbulb className="w-5 h-5 text-yellow-500" /> Tips
                          <span className="ml-2 text-xs text-slate-600">{showTips ? 'Hide' : 'Show'}</span>
                        </button>
                        {showTips && (
                          <ul>
                            {parsed.tips.map((tip, i) => (
                              <li key={i} className="text-slate-800">{tip}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    {(!parsed.title && !parsed.ingredients.length && !parsed.steps.length) && (
                      <ReactMarkdown>{generatedRecipe}</ReactMarkdown>
                    )}
                  </div>
                )}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/50 rounded-2xl p-6 shadow-sm" data-sr>
                  <div className="flex items-center justify-center">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-orange-800 font-medium">
                      We have cooked up something special just for you—based on your preferences. Enjoy and happy cooking!
                    </p>
                  </div>
                </div>

                {showToast && (
                  <div className="mb-4 flex justify-center animate-in slide-in-from-top duration-300">
                    <div className={`max-w-sm bg-white rounded-2xl shadow-2xl border-l-4 ${
                      toastType === 'success' 
                        ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50' 
                        : 'border-red-500 bg-gradient-to-r from-red-50 to-pink-50'
                    } p-4`}>
                      <div className="flex items-start">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          toastType === 'success' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {toastType === 'success' ? (
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <p className={`text-sm font-semibold ${
                            toastType === 'success' ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {toastMessage}
                          </p>
                        </div>
                        <button
                          onClick={() => setShowToast(false)}
                          className="ml-4 flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-4" data-sr-drop>
                  <button
                    onClick={resetForm}
                    className="flex-1 bg-white/70 text-slate-700 py-4 px-6 rounded-2xl font-semibold border border-slate-200/50 hover:bg-white/90 hover:border-slate-300 focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    Create Another
                  </button>
                  {submitted && isLoggedIn && generatedRecipe && (
                    <button
                      onClick={handleSaveRecipe}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-2xl font-semibold hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all duration-300 text-center shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] mt-4"
                    >
                      Save Recipe
                    </button>
                  )}
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