import { usePricing } from './usePricing';
import { useAppStore } from '../store/useAppStore';

// Mock do Zustand store
jest.mock('../store/useAppStore', () => ({
  useAppStore: jest.fn(),
}));

const mockUseAppStore = useAppStore as unknown as jest.Mock;

describe('usePricing Logic Tests', () => {
  const defaultSettings: any = {
    hourlyRate: 15,
    workerProfile: 'beginner',
    fixedCostsPercent: 12, // Regra fixa
    profitMarginPercent: 50,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Deve calcular corretamente o custo unitário de um ingrediente', () => {
    mockUseAppStore.mockReturnValue({
      ingredients: [{ id: '1', name: 'Leite', price: 10, quantity: 1000, unit: 'ml' }],
      recipes: [],
      packagings: [],
      settings: defaultSettings,
    });

    const { getIngredientUnitCost } = usePricing();
    expect(getIngredientUnitCost('1')).toBe(0.01); // 10 / 1000
  });

  test('Deve aplicar 5% de perda no custo da receita', () => {
    mockUseAppStore.mockReturnValue({
      ingredients: [{ id: '1', name: 'Farinha', price: 5, quantity: 1000, unit: 'g' }],
      recipes: [{
        id: 'r1',
        name: 'Massa',
        yieldQuantity: 1000,
        items: [{ ingredientId: '1', usedQuantity: 100 }]
      }],
      packagings: [],
      settings: defaultSettings,
    });

    const { getRecipeTotalCost } = usePricing();
    // Custo base: 100g * (5/1000) = 0.50
    // Com 5% de perda: 0.50 * 1.05 = 0.525
    expect(getRecipeTotalCost('r1')).toBe(0.525);
  });

  test('Deve garantir mão de obra calculada com base no hourlyRate configurado', () => {
    mockUseAppStore.mockReturnValue({
      settings: { ...defaultSettings, hourlyRate: 20 },
    });

    const { getLaborCost } = usePricing();
    // 60 minutos deve custar R$ 20,00
    expect(getLaborCost(60)).toBe(20);
  });

  test('Deve calcular custo total do produto (Ingredientes + Receita + Perda + Indireto + Mão de Obra)', () => {
    mockUseAppStore.mockReturnValue({
      ingredients: [
        { id: 'i1', name: 'Chocolate', price: 20, quantity: 1000, unit: 'g' }
      ],
      recipes: [
        {
          id: 'r1',
          name: 'Massa',
          yieldQuantity: 500,
          items: [{ ingredientId: 'i1', usedQuantity: 500 }] // Custo base: 10.00
        }
      ],
      packagings: [
        { id: 'p1', name: 'Pote', price: 10, quantity: 10, unit: 'un' } // Custo: 1.00
      ],
      settings: defaultSettings,
    });

    const { getProductUnitCost } = usePricing();

    const product = {
      id: 'prod1',
      name: 'Bolo',
      productionTimeMinutes: 60, // R$ 15.00 labor
      components: [
        { id: 'c1', componentId: 'r1', type: 'recipe' as const, usedQuantity: 250 }, // Custo base: 5.00
        { id: 'c2', componentId: 'p1', type: 'packaging' as const, usedQuantity: 1 }  // Custo: 1.00
      ]
    };

    /**
     * CÁLCULO ESPERADO:
     * 1. Custo Conteúdo Real: 5.00 (receita já inclui 5% perda no seu unit cost se foi salva assim, 
     *    mas no nosso mock do teste o 'getRecipeUnitCost' é chamado internamente).
     *    No mock do useAppStore, a receita r1 tem yield 500 e itens totalizando 10.00.
     *    getRecipeTotalCost(r1) = 10.00 * 1.05 = 10.50.
     *    getRecipeUnitCost(r1) = 10.50 / 500 = 0.021.
     *    Componente r1 usado 250g: 250 * 0.021 = 5.25.
     * 
     * 2. No produto:
     *    ingredientsBaseCost = 0.
     *    recipesRealCost = 5.25.
     *    contentRealCost = (0 * 1.05) + 5.25 = 5.25.
     * 
     * 3. Custo Indireto (12%): 5.25 * 0.12 = 0.63.
     * 4. Mão de Obra (60 min): 15.00 (mínimo).
     * 5. Custo Produção: 5.25 + 0.63 + 15.00 = 20.88.
     * 6. Embalagem (p1): 1.00.
     * 7. CTU: 20.88 + 1.00 = 21.88.
     */
    
    expect(getProductUnitCost(product)).toBeCloseTo(21.88, 2);
  });

  test('Deve calcular o preço sugerido com margem (Markup)', () => {
    mockUseAppStore.mockReturnValue({
      ingredients: [],
      recipes: [],
      packagings: [],
      settings: { ...defaultSettings, profitMarginPercent: 50 }, // Margem 50%
    });

    const { getSuggestedPrice } = usePricing();

    const product = {
        id: 'prod1',
        name: 'Bolo',
        productionTimeMinutes: 60, // R$ 15.00 labor (mínimo)
        components: []
    };
    
    // Total cost = 15.00 (labor) + 0 (indirect as content is 0) + 0 (packaging)
    // Price = 15 / (1 - 0.5) = 30.00.
    
    expect(getSuggestedPrice(product)).toBeCloseTo(30.00, 2);
  });

  test('Deve lidar com divisão por zero (rendimento ou quantidade zero)', () => {
    mockUseAppStore.mockReturnValue({
      ingredients: [{ id: '1', name: 'Erro', price: 10, quantity: 0, unit: 'g' }],
      recipes: [],
      packagings: [],
      settings: defaultSettings,
    });

    const { getIngredientUnitCost } = usePricing();
    expect(getIngredientUnitCost('1')).toBe(0);
  });

  test('Deve aplicar taxas adaptativas de perda e gás por perfil de doce (ex: bolo_festa)', () => {
    mockUseAppStore.mockReturnValue({
      ingredients: [{ id: 'i1', name: 'Ninho', price: 20, quantity: 1000, unit: 'g' }],
      recipes: [],
      packagings: [],
      settings: defaultSettings,
    });

    const { getProductProductionCost } = usePricing();

    const productBoloFesta: any = {
      id: 'p1',
      name: 'Bolo de Festa',
      pricingProfile: 'bolo_festa', // 15% perda, 18% gás
      productionTimeMinutes: 60,   // R$ 15 labor
      decorationTimeMinutes: 30,   // R$ 11.25 labor (15 * 1.5 * 0.5)
      components: [
        { id: 'c1', componentId: 'i1', type: 'ingredient', usedQuantity: 500 } // base cost: 10.00
      ]
    };

    // Insumos com Perda (15%): 10 * 1.15 = 11.50
    // Indireto (18%): 11.50 * 0.18 = 2.07
    // Mão de obra (60m + 30m art): 15 + 11.25 = 26.25
    // Total produção: 11.50 + 2.07 + 26.25 = 39.82
    expect(getProductProductionCost(productBoloFesta)).toBeCloseTo(39.82, 2);
  });

  test('Deve calcular o custo unitário dividindo o custo de produção do lote pela quantidade rendida (ex: 10 potes)', () => {
    mockUseAppStore.mockReturnValue({
      ingredients: [{ id: 'i1', name: 'Ninho', price: 20, quantity: 1000, unit: 'g' }],
      recipes: [],
      packagings: [{ id: 'p1', name: 'Pote 220ml', price: 20, quantity: 10, unit: 'un' }], // R$ 2.00 por pote
      settings: defaultSettings,
    });

    const { getProductUnitCost } = usePricing();

    const productBoloPote: any = {
      id: 'pote1',
      name: 'Bolo no Pote',
      pricingProfile: 'bolo_pote', // 8% perda, 12% gás
      productionTimeMinutes: 30,  // R$ 7.50 labor
      batchYieldQuantity: 10,     // Rendeu 10 potes no lote
      components: [
        { id: 'c1', componentId: 'i1', type: 'ingredient', usedQuantity: 500 }, // R$ 10.00 de ingrediente
        { id: 'c2', componentId: 'p1', type: 'packaging', usedQuantity: 1 }      // R$ 2.00 de pote por unidade
      ]
    };

    // Insumos Lote com Perda (8%): 10 * 1.08 = 10.80
    // Indireto Lote (12%): 10.80 * 0.12 = 1.296
    // Mão de obra Lote: 7.50
    // Produção Total Lote: 10.80 + 1.296 + 7.50 = 19.596
    // Produção por Pote (1/10): 1.9596
    // Custo Final por Pote (+ R$ 2.00 Embalagem): 1.9596 + 2.00 = 3.9596
    expect(getProductUnitCost(productBoloPote)).toBeCloseTo(3.96, 2);
  });
});
