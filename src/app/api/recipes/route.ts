import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { connectToDatabase, Recipe, CreateRecipeInput } from '@/lib/mongodb';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CreateRecipeInput = await request.json();
    
    if (!body.title || !body.description || !body.ingredients || !body.steps) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, ingredients, steps' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const recipesCollection = db.collection('recipes');

    const recipe: Recipe = {
      userId: user.id,
      title: body.title,
      description: body.description,
      ingredients: body.ingredients,
      steps: body.steps,
      createdAt: new Date()
    };

    const result = await recipesCollection.insertOne(recipe);
    
    if (!result.insertedId) {
      throw new Error('Failed to insert recipe into MongoDB');
    }

    const { error: supabaseError } = await supabaseAdmin
      .from('recipes')
      .insert({
        user_id: user.id,
        recipe_title: body.title,
        created_at: new Date().toISOString()
      });

    if (supabaseError) {
      console.error('Supabase error:', supabaseError);
    }

    return NextResponse.json({
      success: true,
      recipeId: result.insertedId.toString(),
      message: 'Recipe created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating recipe:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();
    const recipesCollection = db.collection('recipes');

    const recipes = await recipesCollection
      .find({ userId: user.id })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      recipes: recipes,
      count: recipes.length
    });

  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 