const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const recipeSchema = new Schema(
  {
    title: { type: String, required: true },
    ingredients: { type: [String], required: true },
    steps: { type: [String], required: true },
    difficulty: {
      type: Number,
      min: [1, "Minimum difficulty rating is 1"],
      max: [10, "Maximum difficulty rating is 10"],
      required: false,
      default: 1,
    },
    image: { type: String, data: Buffer, required: true },
    tags: {type: [String], required: false, default: []}
  },
  { timestamps: true }
);

const Recipe = mongoose.model("recipe", recipeSchema);

module.exports = Recipe;
