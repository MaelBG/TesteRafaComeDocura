import { useAppStore, Ingredient, Recipe, Product, Packaging, Settings, PricingProfileType, ProductionBatchItem, ConsumedIngredientSummary } from '../store/useAppStore';

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
  products?: Product[];
}) => {
  const { ingredients, recipes, packagings, settings, products = [] } = data;

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

    const packagingUnitCost = packagingBatchCost / batchYield;
    return productionUnitCost + packagingUnitCost;
  };

  const getSuggestedPrice = (product: Product) => {
    const ctu = getProductUnitCost(product);
    const margin = settings.profitMarginPercent / 100;
    if (margin >= 1) return ctu * 2;
    return ctu / (1 - margin);
  };

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

  const getCostPerKg = (product: Product) => {
    if (!product.targetWeightKg || product.targetWeightKg <= 0) return 0;
    const unitCost = getProductUnitCost(product);
    return unitCost / product.targetWeightKg;
  };

  /**
   * Calcula a balança financeira completa de uma sessão de produção (Fornada do Dia).
   */
  const calculateBatchBalance = (batchItems: ProductionBatchItem[]) => {
    const consumedMap: { [id: string]: { name: string; brand?: string; gramsOrUnits: number; unit: string; isPkg: boolean } } = {};
    let totalLaborCost = 0;
    let totalHoursWorked = 0;
    let totalEstimatedRevenue = 0;

    batchItems.forEach((batchItem) => {
      if (batchItem.quantity <= 0) return;

      if (batchItem.type === 'product') {
        const prod = products.find((p) => p.id === batchItem.targetId);
        if (!prod) return;

        const batchYield = (prod.batchYieldQuantity && prod.batchYieldQuantity > 0) ? prod.batchYieldQuantity : 1;
        const usageRatio = batchItem.quantity / batchYield;

        // Horas e Mão de Obra
        const prodMinutes = (prod.productionTimeMinutes || 0) * usageRatio;
        const decorMinutes = (prod.decorationTimeMinutes || 0) * usageRatio;
        totalHoursWorked += (prodMinutes + decorMinutes) / 60;
        totalLaborCost += getLaborCost(prodMinutes, decorMinutes);

        // Faturamento estimado
        const unitPrice = getSuggestedPrice(prod);
        totalEstimatedRevenue += unitPrice * batchItem.quantity;

        // Insumos e Embalagens
        prod.components.forEach((comp) => {
          if (comp.type === 'ingredient') {
            const ing = ingredients.find((i) => i.id === comp.componentId);
            if (ing) {
              const qty = comp.usedQuantity * usageRatio;
              if (!consumedMap[ing.id]) {
                consumedMap[ing.id] = { name: ing.name, brand: ing.brand, gramsOrUnits: 0, unit: ing.unit, isPkg: false };
              }
              consumedMap[ing.id].gramsOrUnits += qty;
            }
          } else if (comp.type === 'packaging') {
            const pkg = packagings.find((p) => p.id === comp.componentId);
            if (pkg) {
              const qty = comp.usedQuantity * usageRatio;
              if (!consumedMap[pkg.id]) {
                consumedMap[pkg.id] = { name: pkg.name, brand: pkg.brand, gramsOrUnits: 0, unit: pkg.unit, isPkg: true };
              }
              consumedMap[pkg.id].gramsOrUnits += qty;
            }
          } else if (comp.type === 'recipe') {
            const rec = recipes.find((r) => r.id === comp.componentId);
            if (rec && rec.yieldQuantity > 0) {
              const recipeGrams = comp.usedQuantity * usageRatio;
              const recipeRatio = recipeGrams / rec.yieldQuantity;

              rec.items.forEach((item) => {
                const ing = ingredients.find((i) => i.id === item.ingredientId);
                if (ing) {
                  const qty = item.usedQuantity * recipeRatio;
                  if (!consumedMap[ing.id]) {
                    consumedMap[ing.id] = { name: ing.name, brand: ing.brand, gramsOrUnits: 0, unit: ing.unit, isPkg: false };
                  }
                  consumedMap[ing.id].gramsOrUnits += qty;
                }
              });
            }
          }
        });
      } else if (batchItem.type === 'recipe') {
        const rec = recipes.find((r) => r.id === batchItem.targetId);
        if (rec) {
          rec.items.forEach((item) => {
            const ing = ingredients.find((i) => i.id === item.ingredientId);
            if (ing) {
              const qty = item.usedQuantity * batchItem.quantity;
              if (!consumedMap[ing.id]) {
                consumedMap[ing.id] = { name: ing.name, brand: ing.brand, gramsOrUnits: 0, unit: ing.unit, isPkg: false };
              }
              consumedMap[ing.id].gramsOrUnits += qty;
            }
          });
          totalHoursWorked += (20 * batchItem.quantity) / 60; // 20 min por receita base
          totalLaborCost += ((20 * batchItem.quantity) / 60) * (settings.hourlyRate || 15);
        }
      }
    });

    const consumedIngredients: ConsumedIngredientSummary[] = [];
    let totalIngredientsCost = 0;
    let totalPackagingCost = 0;

    Object.keys(consumedMap).forEach((id) => {
      const item = consumedMap[id];
      if (item.isPkg) {
        const pkg = packagings.find((p) => p.id === id);
        const pkgSize = pkg?.quantity || 1;
        const packagesUsed = parseFloat((item.gramsOrUnits / pkgSize).toFixed(2));
        const cost = (pkg?.price || 0) * packagesUsed;
        totalPackagingCost += cost;

        consumedIngredients.push({
          id,
          name: item.name,
          brand: item.brand,
          totalGramsOrUnits: item.gramsOrUnits,
          packagesUsed,
          packageUnit: item.unit,
          totalCost: cost,
        });
      } else {
        const ing = ingredients.find((i) => i.id === id);
        const ingSize = ing?.quantity || 1;
        const packagesUsed = parseFloat((item.gramsOrUnits / ingSize).toFixed(2));
        const cost = (ing?.price || 0) * packagesUsed;
        totalIngredientsCost += cost;

        consumedIngredients.push({
          id,
          name: item.name,
          brand: item.brand,
          totalGramsOrUnits: item.gramsOrUnits,
          packagesUsed,
          packageUnit: item.unit,
          totalCost: cost,
        });
      }
    });

    const fixedRate = (settings.fixedCostsPercent || 12) / 100;
    const totalFixedCost = (totalIngredientsCost + totalPackagingCost) * fixedRate;
    const totalProductionCost = totalIngredientsCost + totalPackagingCost + totalLaborCost + totalFixedCost;
    const totalEstimatedProfit = totalEstimatedRevenue - totalProductionCost;

    return {
      consumedIngredients,
      totalIngredientsCost,
      totalPackagingCost,
      totalLaborCost,
      totalFixedCost,
      totalProductionCost,
      totalEstimatedRevenue,
      totalEstimatedProfit,
      totalHoursWorked,
    };
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
    calculateBatchBalance,
  };
};

export function usePricing() {
  const { ingredients, recipes, packagings, settings, products } = useAppStore();
  return pricingCalculator({ ingredients, recipes, packagings, settings, products });
}
