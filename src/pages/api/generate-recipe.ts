// src/pages/api/generate-recipe.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, ingredients } = req.body;
  const apiKey = process.env.GEMINI_API_KEY; 

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not set' });
  }

  // Build a more structured prompt for better formatting
  let prompt = '';
  if (name) {
    prompt = `Create a detailed recipe for "${name}"${ingredients ? ' using these ingredients: ' + ingredients : ''}. 

Please format the recipe with the following structure:
- Recipe title
- Servings information
- Prep time and cook time
- Ingredients list (one per line with quantities)
- Step-by-step instructions (numbered)
- Nutritional Information (for total dish):
  * Total Calories
  * Total Weight (grams)
  * Total Protein (grams)
  * Total Carbohydrates (grams)
  * Total Fats (grams)
- Any helpful tips

Make it clear, well-organized, and easy to follow. Include accurate nutritional estimates based on the ingredients and quantities used. Calculate the TOTAL nutrition for the entire dish, not per serving.`;
  } else if (ingredients) {
    prompt = `Create a creative recipe using these ingredients: ${ingredients}.

Please format the recipe with the following structure:
- Recipe title
- Servings information  
- Prep time and cook time
- Ingredients list (one per line with quantities)
- Step-by-step instructions (numbered)
- Nutritional Information (for total dish):
  * Total Calories
  * Total Weight (grams)
  * Total Protein (grams)
  * Total Carbohydrates (grams)
  * Total Fats (grams)
- Any helpful tips

Make it clear, well-organized, and easy to follow. Include accurate nutritional estimates based on the ingredients and quantities used. Calculate the TOTAL nutrition for the entire dish, not per serving.`;
  } else {
    prompt = `Generate a random delicious recipe.

Please format the recipe with the following structure:
- Recipe title
- Servings information
- Prep time and cook time  
- Ingredients list (one per line with quantities)
- Step-by-step instructions (numbered)
- Nutritional Information (for total dish):
  * Total Calories
  * Total Weight (grams)
  * Total Protein (grams)
  * Total Carbohydrates (grams)
  * Total Fats (grams)
- Any helpful tips

Make it clear, well-organized, and easy to follow. Include accurate nutritional estimates based on the ingredients and quantities used. Calculate the TOTAL nutrition for the entire dish, not per serving.`;
  }

  console.log("Prompt sent to Gemini:", prompt);

  const geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey;

  try {
    const geminiRes = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        }
      }),
    });
    
    const data = await geminiRes.json();
    
    if (!geminiRes.ok) {
      throw new Error(`Gemini API error: ${data.error?.message || 'Unknown error'}`);
    }
    
    const recipe = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No recipe generated';
    res.status(200).json({ text: recipe });
  } catch (error) {
    console.error('Recipe generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate recipe', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}