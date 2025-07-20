import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import connectDB from '@/lib/mongoose';
import Recipe from '@/models/Recipe';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, ingredients, steps } = body;

    if (!title || !description || !ingredients || !steps) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, ingredients, steps' },
        { status: 400 }
      );
    }

    const recipe = await Recipe.create({
      userId: user.id,
      title,
      description,
      ingredients,
      steps
    });

    return NextResponse.json({
      success: true,
      recipeId: recipe._id,
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
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const recipes = await Recipe.find({ userId: user.id }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      recipes,
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