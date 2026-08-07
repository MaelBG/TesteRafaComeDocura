import { useAppStore } from '../store/useAppStore';

export function useStock() {
  const deductRecipeStock = (recipeId: string, multiplier: number = 1) => {
    useAppStore.getState().deductRecipeStock(recipeId, multiplier);
  };

  const deductProductStock = (productId: string, quantity: number = 1) => {
    useAppStore.getState().deductProductStock(productId, quantity);
  };

  return {
    deductRecipeStock,
    deductProductStock,
  };
}
