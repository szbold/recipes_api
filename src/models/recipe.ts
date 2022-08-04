import mongoose from "mongoose";
const Schema = mongoose.Schema;

const recipeSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: false },
    servings: { type: String, required: true },
    prepTime: { type: String, required: true },
    ingredients: {
      type: [String],
      required: true,
      validate: (ingredients: string[]) =>
        Array.isArray(ingredients) && ingredients.length > 0,
    },
    steps: {
      type: [String],
      required: true,
      validate: (steps: string[]) => Array.isArray(steps) && steps.length > 0,
    },
    difficulty: {
      type: Number,
      min: [1, "Minimum difficulty rating is 1"],
      max: [5, "Maximum difficulty rating is 5"],
      required: false,
      default: 1,
    },
    image: { type: String, data: Buffer, required: true },
    tags: { type: [String], required: false, default: [] },
  },
  { timestamps: true }
);

export const Recipe = mongoose.model("recipe", recipeSchema);
