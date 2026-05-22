import { useAppStore, Ingredient, Recipe, Product, Packaging, Settings } from '../store/useAppStore';

/**
 * Lógica pura de precificação que não depende de Hooks do React.
 * Pode ser usada em testes ou funções utilitárias.
 */
export const pricingCalculator = (data: {
  ingredients: Ingredient[];
  recipes: Recipe[];
  packagings: Packaging[];
  settings: Settings;
}) => {
  const { ingredients, recipes, packagings, settings } = data;

  const getIngredientUnitCost = (ingredientId: string) => {
    const ing = ingredients.find((i) => i.id === ingredientId);
    if (!ing || ing.quantity === 0) return 0;
    return ing.price / ing.quantity;
  };

  const getPackagingUnitCost = (packagingId: string) => {
    const pkg = packagings.find((p) => p.id === packagingId);
    if (!pkg || pkg.quantity === 0) return 0;
    return pkg.price / pkg.quantity;
  };

  const getRecipeTotalCost = (recipeId: string) => {
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return 0;

    const baseCost = recipe.items.reduce((acc, item) => {
      const unitCost = getIngredientUnitCost(item.ingredientId);
      return acc + unitCost * item.usedQuantity;
    }, 0);

    return baseCost * 1.05;
  };

  const getRecipeUnitCost = (recipeId: string) => {
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe || recipe.yieldQuantity === 0) return 0;
    return getRecipeTotalCost(recipeId) / recipe.yieldQuantity;
  };

  const getLaborCost = (minutes: number) => {
    // Agora o valor da hora é definido diretamente pelo Assistente de Mão de Obra
    const hourlyRate = settings.hourlyRate || 15;
    return (minutes / 60) * hourlyRate;
  };

  const getProductProductionCost = (product: Product) => {
    const ingredientsBaseCost = product.components.reduce((acc, comp) => {
      if (comp.type === 'ingredient') {
        return acc + getIngredientUnitCost(comp.componentId) * comp.usedQuantity;
      }
      return acc;
    }, 0);

    const recipesRealCost = product.components.reduce((acc, comp) => {
      if (comp.type === 'recipe') {
        return acc + getRecipeUnitCost(comp.componentId) * comp.usedQuantity;
      }
      return acc;
    }, 0);

    const contentRealCost = (ingredientsBaseCost * 1.05) + recipesRealCost;
    const indirectCost = contentRealCost * 0.12;
    const laborCost = getLaborCost(product.productionTimeMinutes);

    return contentRealCost + indirectCost + laborCost;
  };

  const getProductUnitCost = (product: Product) => {
    const productionCost = getProductProductionCost(product);
    const packagingCost = product.components.reduce((acc, comp) => {
      if (comp.type === 'packaging') {
        return acc + getPackagingUnitCost(comp.componentId) * comp.usedQuantity;
      }
      return acc;
    }, 0);

    return productionCost + packagingCost;
  };

  const getSuggestedPrice = (product: Product) => {
    const ctu = getProductUnitCost(product);
    const margin = settings.profitMarginPercent / 100;
    if (margin >= 1) return ctu * 2;
    return ctu / (1 - margin);
  };

  return {
    getIngredientUnitCost,
    getPackagingUnitCost,
    getRecipeTotalCost,
    getRecipeUnitCost,
    getLaborCost,
    getProductProductionCost,
    getProductUnitCost,
    getSuggestedPrice,
    hourlyRate: settings.hourlyRate || 15,
  };
};

/**
 * Hook que injeta os dados da store na lógica de precificação.
 */
export const usePricing = () => {
  const storeData = useAppStore();
  return pricingCalculator(storeData);
};
