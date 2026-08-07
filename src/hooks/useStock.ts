import { useAppStore, RecipeItem, ProductComponent } from '../store/useAppStore';

export function useStock() {
  const deductRecipeStock = (recipeId: string, multiplier: number = 1) => {
    useAppStore.getState().deductRecipeStock(recipeId, multiplier);
  };

  const deductProductStock = (productId: string, quantity: number = 1) => {
    useAppStore.getState().deductProductStock(productId, quantity);
  };

  const deductRecipeItems = (items: RecipeItem[], multiplier: number = 1) => {
    useAppStore.getState().deductRecipeItems(items, multiplier);
  };

  const deductProductComponents = (components: ProductComponent[], batchYield: number = 1) => {
    useAppStore.getState().deductProductComponents(components, batchYield);
  };

  return {
    deductRecipeStock,
    deductProductStock,
    deductRecipeItems,
    deductProductComponents,
  };
}
