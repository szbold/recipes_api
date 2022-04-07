const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const recipeSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: false },
    ingredients: { type: [String], required: true },
    steps: { type: [String], required: true },
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

const Recipe = mongoose.model("recipe", recipeSchema);

module.exports = Recipe;
