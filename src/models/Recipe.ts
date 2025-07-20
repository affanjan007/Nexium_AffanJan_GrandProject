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
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.models.Recipe || mongoose.model('Recipe', RecipeSchema); 