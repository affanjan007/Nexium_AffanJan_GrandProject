# AI-Powered Recipe Generator

This is a modern, full-stack web application that lets users generate personalized recipes using AI. 
Users can input ingredients and optional recipe names, and the app intelligently creates cooking instructions. Recipes can be saved, copied, and filtered for easy management.

## Features

- AI-generated recipes using user inputs or random generation
- Ingredient-based recipe generation (requires user login)
- Real-time progress animation during generation
- Clean UI with animated transitions and scroll effects
- Save and manage recipes 
- Sectional toggle for Ingredients, Instructions, and Tips
- Copy-to-clipboard functionality
- Modern toast notifications
- Responsive and mobile-friendly design

## Tech Stack

- Frontend: React (Next.js), Tailwind CSS
- Backend: Node.js (API routes), Supabase (Auth & DB), n8n (Webhook integration), MongoDB Atlas(Saved Recipe)
- Auth: Supabase Auth (Magic link login)
- Markdown Parsing: `react-markdown`
- Icons: `lucide-react`

## Usage

1. First, log in using the magic link sent to your email.
2. Go to the homepage and input ingredients and optionally a recipe name.
3. Click "Generate Recipe" to start.
4. Wait for the progress bar to complete.
5. Save, copy, or explore the AI-generated recipe.
6. Navigate to "My Recipes" to manage your saved content.

## Setup Instructions

1. Clone the repository
   git clone https://github.com/your-username/recipe-generator.git
   cd recipe-generator
   npm install
   npm run dev OR npm start
