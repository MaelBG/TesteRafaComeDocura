import { useAppStore } from '../store/useAppStore';

export function useStock() {
  /**
   * Dá baixa de estoque para uma Receita Base produzida
   * @param recipeId Id da receita
   * @param multiplier Multiplicador da receita (ex: 2 para receita dobrada)
   */
  const deductRecipeStock = (recipeId: string, multiplier: number = 1) => {
    const { ingredients, recipes, updateIngredient } = useAppStore.getState();
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    recipe.items.forEach(item => {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      if (ing && ing.quantity > 0) {
        const totalGramsUsed = (item.usedQuantity || 0) * multiplier;
        const packagesUsed = totalGramsUsed / ing.quantity;
        const newStock = Math.max(0, (ing.stock || 0) - packagesUsed);
        updateIngredient(ing.id, { stock: newStock });
      }
    });
  };

  /**
   * Dá baixa de estoque para um Produto / Doce produzido ou vendido
   * @param productId Id do produto
   * @param quantity Quantidade de doces produzidos ou vendidos
   */
  const deductProductStock = (productId: string, quantity: number = 1) => {
    const { ingredients, packagings, recipes, products, updateIngredient, updatePackaging } = useAppStore.getState();
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const batchYield = (product.batchYieldQuantity && product.batchYieldQuantity > 0) ? product.batchYieldQuantity : 1;
    const usageRatio = quantity / batchYield;

    product.components.forEach(comp => {
      if (comp.type === 'ingredient') {
        const ing = ingredients.find(i => i.id === comp.componentId);
        if (ing && ing.quantity > 0) {
          const totalGramsUsed = comp.usedQuantity * usageRatio;
          const packagesUsed = totalGramsUsed / ing.quantity;
          const newStock = Math.max(0, (ing.stock || 0) - packagesUsed);
          updateIngredient(ing.id, { stock: newStock });
        }
      } else if (comp.type === 'packaging') {
        const pkg = packagings.find(p => p.id === comp.componentId);
        if (pkg && pkg.quantity > 0) {
          const totalUnitsUsed = comp.usedQuantity * usageRatio;
          const packagesUsed = totalUnitsUsed / pkg.quantity;
          const newStock = Math.max(0, (pkg.stock || 0) - packagesUsed);
          updatePackaging(pkg.id, { stock: newStock });
        }
      } else if (comp.type === 'recipe') {
        const recipe = recipes.find(r => r.id === comp.componentId);
        if (recipe && recipe.yieldQuantity > 0) {
          const totalRecipeYieldUsed = comp.usedQuantity * usageRatio;
          const recipeUsageFactor = totalRecipeYieldUsed / recipe.yieldQuantity;

          recipe.items.forEach(item => {
            const ing = ingredients.find(i => i.id === item.ingredientId);
            if (ing && ing.quantity > 0) {
              const totalGramsUsed = item.usedQuantity * recipeUsageFactor;
              const packagesUsed = totalGramsUsed / ing.quantity;
              const newStock = Math.max(0, (ing.stock || 0) - packagesUsed);
              updateIngredient(ing.id, { stock: newStock });
            }
          });
        }
      }
    });
  };

  return {
    deductRecipeStock,
    deductProductStock,
  };
}
