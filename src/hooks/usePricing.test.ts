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
    expect(getRecipeTotalCost('r1')).toBe(0.525);
  });

  test('Deve garantir mão de obra calculada com base no hourlyRate configurado', () => {
    mockUseAppStore.mockReturnValue({
      settings: { ...defaultSettings, hourlyRate: 20 },
    });

    const { getLaborCost } = usePricing();
    expect(getLaborCost(60)).toBe(20);
  });

  test('Deve recalcular instantaneamente todas as receitas ao alterar o preço do insumo de referência', () => {
    // 1. Preço inicial do Leite Condensado: R$ 6,50
    mockUseAppStore.mockReturnValue({
      ingredients: [{ id: 'ing-1', name: 'Leite Condensado', brand: 'Moça', price: 6.50, quantity: 395, unit: 'g' }],
      recipes: [{
        id: 'rec-1',
        name: 'Recheio',
        yieldQuantity: 395,
        items: [{ ingredientId: 'ing-1', usedQuantity: 395 }]
      }],
      packagings: [],
      settings: defaultSettings,
    });

    let pricing = usePricing();
    // 6.50 * 1.05 = 6.825
    expect(pricing.getRecipeTotalCost('rec-1')).toBeCloseTo(6.825, 3);

    // 2. Confeiteiro comprou Piracanjuba por R$ 5,20
    mockUseAppStore.mockReturnValue({
      ingredients: [{ id: 'ing-1', name: 'Leite Condensado', brand: 'Piracanjuba', price: 5.20, quantity: 395, unit: 'g' }],
      recipes: [{
        id: 'rec-1',
        name: 'Recheio',
        yieldQuantity: 395,
        items: [{ ingredientId: 'ing-1', usedQuantity: 395 }]
      }],
      packagings: [],
      settings: defaultSettings,
    });

    pricing = usePricing();
    // 5.20 * 1.05 = 5.46
    expect(pricing.getRecipeTotalCost('rec-1')).toBeCloseTo(5.46, 3);
  });

  test('Deve calcular o Balanço da Fornada consolidando insumos, faturamento e lucro estimado', () => {
    const mockIngs = [
      { id: 'i1', name: 'Leite Condensado', brand: 'Moça', price: 6.50, quantity: 395, unit: 'g', stock: 10 },
      { id: 'i2', name: 'Creme de Leite', brand: 'Nestlé', price: 3.80, quantity: 200, unit: 'g', stock: 10 },
    ];
    const mockPkgs = [
      { id: 'p1', name: 'Pote 220ml', brand: 'Galvanotek', price: 12.00, quantity: 10, unit: 'un', stock: 50 }
    ];
    const mockRecs = [
      {
        id: 'r1',
        name: 'Recheio',
        yieldQuantity: 595,
        yieldUnit: 'g',
        items: [
          { ingredientId: 'i1', usedQuantity: 395 },
          { ingredientId: 'i2', usedQuantity: 200 },
        ]
      }
    ];
    const mockProds = [
      {
        id: 'prod1',
        name: 'Bolo de Pote',
        pricingProfile: 'bolo_pote' as const,
        productionTimeMinutes: 30,
        batchYieldQuantity: 10,
        components: [
          { id: 'c1', componentId: 'r1', type: 'recipe' as const, usedQuantity: 595 },
          { id: 'c2', componentId: 'p1', type: 'packaging' as const, usedQuantity: 10 },
        ]
      }
    ];

    mockUseAppStore.mockReturnValue({
      ingredients: mockIngs,
      packagings: mockPkgs,
      recipes: mockRecs,
      products: mockProds,
      settings: { ...defaultSettings, hourlyRate: 15, profitMarginPercent: 50, fixedCostsPercent: 10 },
    });

    const { calculateBatchBalance } = usePricing();

    // Fornada com 10 Bolos de Pote (1 lote)
    const balance = calculateBatchBalance([
      { targetId: 'prod1', type: 'product', name: 'Bolo de Pote', quantity: 10 }
    ]);

    // Consumiu exatamente 1 lata de Leite Condensado (R$ 6.50) e 1 caixa de Creme de Leite (R$ 3.80) = R$ 10.30
    // Consumiu 10 potes = 1 pacote de R$ 12.00
    expect(balance.totalIngredientsCost).toBeCloseTo(10.30, 2);
    expect(balance.totalPackagingCost).toBe(12.00);
    expect(balance.totalLaborCost).toBe(7.50); // 30 min a R$ 15/h
    expect(balance.totalEstimatedRevenue).toBeGreaterThan(balance.totalProductionCost);
    expect(balance.totalEstimatedProfit).toBeGreaterThan(0);
  });
});
