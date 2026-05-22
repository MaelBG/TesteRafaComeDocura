import { useAppStore } from '../store/useAppStore';
import { pricingCalculator } from '../hooks/usePricing';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

describe('Integration Flow: Ingredient -> Recipe -> Product', () => {
  beforeEach(() => {
    useAppStore.setState({
      ingredients: [],
      recipes: [],
      products: [],
      packagings: [],
      sales: [],
      settings: {
        hourlyRate: 15,
        workerProfile: 'beginner',
        fixedCostsPercent: 12,
        profitMarginPercent: 50,
      }
    });
  });

  test('Alterar preço do ingrediente deve refletir no preço sugerido do produto', () => {
    const { addIngredient, addRecipe, addProduct } = useAppStore.getState();

    // 1. Adicionar Ingrediente: Farinha R$ 10 / 1kg
    addIngredient({ name: 'Farinha', price: 10, quantity: 1000, unit: 'g', stock: 10 });
    const ingId = useAppStore.getState().ingredients[0].id;

    // 2. Adicionar Receita: Massa usando 500g de Farinha. 
    // Custo base: 5.00. Real (c/ 5% perda): 5.25. Yield: 1.
    addRecipe({
      name: 'Massa',
      yieldQuantity: 1,
      yieldUnit: 'un',
      items: [{ id: 'ri1', ingredientId: ingId, usedQuantity: 500 }]
    });
    const recipeId = useAppStore.getState().recipes[0].id;

    // 3. Adicionar Produto: Bolo usando 1 Massa.
    // Custo Conteúdo: 5.25. Indireto (12%): 0.63. Labor (0min): 0. 
    // CTU: 5.88. Sugerido (50%): 11.76
    addProduct({
      name: 'Bolo de Pote',
      productionTimeMinutes: 0,
      components: [{ id: 'pc1', componentId: recipeId, type: 'recipe', usedQuantity: 1 }]
    });
    
    // Usamos a calculadora pura passando o estado atual do store
    const calc = () => pricingCalculator(useAppStore.getState());
    
    let product = useAppStore.getState().products[0];
    expect(calc().getSuggestedPrice(product)).toBeCloseTo(11.76, 2);

    // 4. AUMENTAR preço da Farinha para R$ 20.
    // Custo base: 10.00. Real: 10.50.
    // CTU: 10.50 + (10.50 * 0.12) = 10.50 + 1.26 = 11.76
    // Sugerido (50%): 11.76 / 0.5 = 23.52
    useAppStore.getState().updateIngredient(ingId, { price: 20 });
    
    expect(calc().getSuggestedPrice(product)).toBeCloseTo(23.52, 2);
  });
});
