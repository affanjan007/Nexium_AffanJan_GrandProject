import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongoose';
import Recipe from '@/models/Recipe';


function parseRecipe(content: string) {
  const cleanContent = content.replace(/\*\*/g, '').replace(/#+/g, '').trim();
  
  const lines = cleanContent.split('\n').filter(line => line.trim());
  let title = 'Untitled Recipe';
  
  const titlePatterns = [
    /^recipe[:\s]*(.+?)$/im,
    /^(.+?)\s*recipe$/im,
    /^([^:]+?)(?:\s*:|\s*$)/m
  ];
  
  for (const pattern of titlePatterns) {
    const match = cleanContent.match(pattern);
    if (match && match[1] && match[1].trim().length > 0) {
      title = match[1].trim();
      break;
    }
  }
  
  if (title === 'Untitled Recipe' && lines.length > 0) {
    title = lines[0].replace(/[*#-]/g, '').trim();
  }

  // Extract description: first non-title, non-section line
  let description = '';
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (
      line &&
      !/^ingredients[:\s]*/i.test(line) &&
      !/^instructions?[:\s]*/i.test(line) &&
      !/^steps?[:\s]*/i.test(line) &&
      !/^tips?[:\s]*/i.test(line) &&
      !/^servings?[:\s]*/i.test(line) &&
      !/^prep time[:\s]*/i.test(line) &&
      !/^cook time[:\s]*/i.test(line) &&
      !/^total time[:\s]*/i.test(line)
    ) {
      description = line;
      break;
    }
  }

  const ingredientsSection = extractSection(cleanContent, [
    'ingredients',
    'what you need',
    'shopping list'
  ]);
  
  const ingredients = ingredientsSection
    ? parseList(ingredientsSection)
    : [];

  const instructionsSection = extractSection(cleanContent, [
    'instructions',
    'directions',
    'method',
    'steps',
    'preparation'
  ]);
  
  const steps = instructionsSection
    ? parseSteps(instructionsSection)
    : [];

  const nutritionSection = extractSection(cleanContent, [
    'nutritional information',
    'nutrition',
    'nutrition facts'
  ]);
  
  const nutrition = nutritionSection
    ? parseNutrition(nutritionSection)
    : { calories: 0, weight: 0, protein: 0, carbohydrates: 0, fats: 0 };

  const servings = extractInfo(cleanContent, ['servings', 'serves', 'portions']);
  const prepTime = extractInfo(cleanContent, ['prep time', 'preparation time']);
  const cookTime = extractInfo(cleanContent, ['cook time', 'cooking time', 'bake time']);
  const totalTime = extractInfo(cleanContent, ['total time', 'time']);

  return { 
    title, 
    description,
    ingredients, 
    steps, 
    nutrition,
    servings,
    prepTime,
    cookTime,
    totalTime
  };
}

function extractSection(content: string, sectionNames: string[]): string | null {
  for (const sectionName of sectionNames) {
    const regex = new RegExp(`${sectionName}[:\s]*\n([\\s\\S]*?)(?=\n\n|$|\n[a-zA-Z]+[:\s]*\n)`, 'i');
    const match = content.match(regex);
    if (match) {
      return match[1].trim();
    }
  }
  return null;
}

function parseList(text: string): string[] {
  return text
    .split(/\n/)
    .map(line => line.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').trim())
    .filter(line => line.length > 0 && !line.match(/^[a-zA-Z]+[:\s]*$/));
}

function parseSteps(text: string): string[] {
  const steps = text
    .split(/\n\d+\.\s*|\n(?=\d+\.\s*)/)
    .map(step => step.replace(/^\d+\.\s*/, '').trim())
    .filter(step => step.length > 0);
  
  // If no numbered steps found, try splitting by sentences or paragraphs
  if (steps.length <= 1) {
    return text
      .split(/\n\n|\. (?=[A-Z])/)
      .map(step => step.trim())
      .filter(step => step.length > 10); 
  }
  
  return steps;
}

function extractInfo(content: string, keywords: string[]): string | null {
  for (const keyword of keywords) {
    const regex = new RegExp(`${keyword}[:\s]*([^\n]+)`, 'i');
    const match = content.match(regex);
    if (match) {
      return match[1].trim();
    }
  }
  return null;
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await connectDB();

  const { userId, name, ingredients, content } = req.body;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: No user ID provided.' });
  }

  const parsed = parseRecipe(content);

  const existing = await Recipe.findOne({ userId, title: parsed.title || name });
  if (existing) {
    return res.status(409).json({ error: 'Recipe already exists.' });
  }

  try {
    const recipe = await Recipe.create({
      userId,
      title: parsed.title || name || 'Untitled Recipe',
      description: parsed.description || '',
      ingredients: parsed.ingredients.length ? parsed.ingredients : [ingredients].filter(Boolean),
      steps: parsed.steps,
      nutrition: parsed.nutrition,
      servings: parsed.servings,
      prepTime: parsed.prepTime,
      cookTime: parsed.cookTime,
      totalTime: parsed.totalTime,
    });
    res.status(200).json({ success: true, recipe });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
}