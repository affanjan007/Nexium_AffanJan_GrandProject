# MongoDB Setup Guide

## Environment Variables

Add the following to your `.env.local` file:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://127.0.0.1:27017/recipeGeneratorDB
```

## MongoDB Installation & Setup

### Option 1: Local MongoDB Installation

1. **Install MongoDB Community Edition:**
   - Windows: Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - macOS: `brew install mongodb-community`
   - Linux: Follow [MongoDB Installation Guide](https://docs.mongodb.com/manual/installation/)

2. **Start MongoDB Service:**
   - Windows: MongoDB runs as a service automatically

### Option 2: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string and replace the MONGODB_URI in `.env.local`

## Testing the Setup

1. Start your Next.js development server:
   ```bash
   npm run dev
   ```

2. Visit the test page: `http://localhost:3000/test-blogs`

3. Try creating a blog post to test the MongoDB connection

## API Endpoints

- `POST /api/blogs` - Create a new blog
- `GET /api/blogs` - List all blogs (with pagination and search)
- `GET /api/blogs/[id]` - Get a specific blog
- `PUT /api/blogs/[id]` - Update a blog
- `DELETE /api/blogs/[id]` - Delete a blog

## Blog Schema

```typescript
{
  url: string (required, unique)
  title: string (required)
  fullContent: string (required)
  summary: string
  author: string
  publishedDate: Date
  tags: string[]
  wordCount: number
  createdAt: Date
  updatedAt: Date
}
```

## Features

- ✅ MongoDB connection with Mongoose
- ✅ Blog CRUD operations
- ✅ Search functionality
- ✅ Pagination
- ✅ Tag filtering
- ✅ Automatic word count calculation
- ✅ Unique URL validation
- ✅ Timestamps 

Perfect! You have MongoDB running locally and your connection string is:
```
MONGODB_URI=mongodb://127.0.0.1:27017/recipeGeneratorDB
```

Here’s what I’ll do next:
1. **Add your MongoDB URI to your environment variables** (in `.env.local`).
2. **Ensure you have Mongoose models for your collections** (`users`, `blogs`, `recipes`).
3. **Optionally, insert a dummy document into each collection so they appear in MongoDB Compass or other tools.**

---

### 1. Add MongoDB URI to `.env.local`

Please add this line to your `.env.local` file (alongside your Supabase URL):
```
MONGODB_URI=mongodb://127.0.0.1:27017/recipeGeneratorDB
```
*(If you want, I can show you the exact file content.)*

---

### 2. Mongoose Models

You already have a `Blog.ts` model. I’ll create `User.ts` and `Recipe.ts` models in `src/models/` for you.

---

### 3. Insert Dummy Data

I’ll provide a script you can run to insert one dummy document into each collection.

---

**Would you like me to:**
- Add the Mongoose model files for `User` and `Recipe`?
- Provide a script to insert dummy data?

Let me know if you want both, or just one! 