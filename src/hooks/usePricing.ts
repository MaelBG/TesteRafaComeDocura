import { useAppStore, Ingredient, Recipe, Product, Packaging, Settings, PricingProfileType } from '../store/useAppStore';

/**
 * Retorna o fator de perda/desperdício por perfil de doce.
 */
export const getProfileLossFactor = (profile?: PricingProfileType): number => {
  switch (profile) {
    case 'bolo_festa':
      return 1.15; // 15% de perda (cobertura Chantininho retida no bowl/sacos)
    case 'brigadeiro':
      return 1.10; // 10% de perda (raspa de panela + confeito granulado perdido)
    case 'bolo_pote':
      return 1.08; // 8% de perda (farelos de fatiamento)
    case 'macaron':
      return 1.25; // 25% de perda (triagem de cascas e risco de quebra)
    case 'padrao':
    default:
      return 1.05; // 5% de perda padrão
  }
};

/**
 * Retorna a taxa de custos indiretos (gás, água, energia) por perfil de doce.
 */
export const getProfileIndirectRate = (profile?: PricingProfileType): number => {
  switch (profile) {
    case 'bolo_festa':
      return 0.18; // 18% (forno por 1h+, batedeira e 12h de refrigeração)
    case 'brigadeiro':
      return 0.10; // 10% (cocção em panela 20min)
    case 'bolo_pote':
      return 0.12; // 12% (forno retangular + refrigeração)
    case 'macaron':
      return 0.14; // 14% (forno técnico com precisão)
    case 'padrao':
    default:
      return 0.12; // 12% padrão
  }
};

/**
 * Lógica pura de precificação que não depende de Hooks do React.
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

  const getLaborCost = (productionMinutes: number, decorationMinutes: number = 0) => {
    const hourlyRate = settings.hourlyRate || 15;
    const baseLabor = (productionMinutes / 60) * hourlyRate;
    // Mão de obra de decoração artística possui adicional de 50% no valor hora
    const artisticLabor = (decorationMinutes / 60) * (hourlyRate * 1.5);
    return baseLabor + artisticLabor;
  };

  const getProductProductionCost = (product: Product) => {
    const lossFactor = getProfileLossFactor(product.pricingProfile);
    const indirectRate = getProfileIndirectRate(product.pricingProfile);

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

    const batchContentRealCost = (ingredientsBaseCost * lossFactor) + recipesRealCost;
    const batchIndirectCost = batchContentRealCost * indirectRate;
    const batchLaborCost = getLaborCost(
      product.productionTimeMinutes || 0,
      product.decorationTimeMinutes || 0
    );

    const totalBatchProductionCost = batchContentRealCost + batchIndirectCost + batchLaborCost;

    const batchYield = (product.batchYieldQuantity && product.batchYieldQuantity > 0) ? product.batchYieldQuantity : 1;
    return totalBatchProductionCost / batchYield;
  };

  const getProductUnitCost = (product: Product) => {
    const productionUnitCost = getProductProductionCost(product);
    const batchYield = (product.batchYieldQuantity && product.batchYieldQuantity > 0) ? product.batchYieldQuantity : 1;

    const packagingBatchCost = product.components.reduce((acc, comp) => {
      if (comp.type === 'packaging') {
        return acc + getPackagingUnitCost(comp.componentId) * comp.usedQuantity;
      }
      return acc;
    }, 0);

    // Custo de embalagem por unidade (dividido pelo rendimento do lote)
    const packagingUnitCost = packagingBatchCost / batchYield;

    return productionUnitCost + packagingUnitCost;
  };

  const getSuggestedPrice = (product: Product) => {
    const ctu = getProductUnitCost(product);
    const margin = settings.profitMarginPercent / 100;
    if (margin >= 1) return ctu * 2;
    return ctu / (1 - margin);
  };

  /**
   * Retorna o lucro líquido e a margem de lucro real calculados com base no preço praticado.
   */
  const getActualMarginAndProfit = (product: Product) => {
    const cost = getProductUnitCost(product);
    const sellingPrice = product.actualSellingPrice && product.actualSellingPrice > 0
      ? product.actualSellingPrice
      : getSuggestedPrice(product);

    const profit = sellingPrice - cost;
    const marginPercent = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

    return {
      cost,
      sellingPrice,
      profit,
      marginPercent,
    };
  };

  /**
   * Para bolos de festa, calcula o custo por Quilo (R$/Kg).
   */
  const getCostPerKg = (product: Product) => {
    const totalCost = getProductUnitCost(product);
    const weightKg = product.targetWeightKg && product.targetWeightKg > 0 ? product.targetWeightKg : 1;
    return totalCost / weightKg;
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
    getActualMarginAndProfit,
    getCostPerKg,
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
