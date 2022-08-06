export interface IRecipe {
  title: string;
  description: string | undefined;
  servings: string;
  prepTime: string;
  ingredients: string[];
  steps: string[];
  difficulty: number;
  image: string;
  tags: string[];
}
