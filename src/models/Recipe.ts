import mongoose from 'mongoose';

const RecipeSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  ingredients: [{
    type: String
  }],
  steps: [{
    type: String
  }],
  nutrition: {
    calories: {
      type: Number,
      default: 0
    },
    weight: {
      type: Number,
      default: 0
    },
    protein: {
      type: Number,
      default: 0
    },
    carbohydrates: {
      type: Number,
      default: 0
    },
    fats: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.models.Recipe || mongoose.model('Recipe', RecipeSchema); 