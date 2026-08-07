import { useStock } from './useStock';
import { useAppStore } from '../store/useAppStore';

// Mock do AsyncStorage para testes do Zustand
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

describe('useStock Hook - Testes Rigorosos de Baixa de Estoque', () => {
  beforeEach(() => {
    useAppStore.setState({
      ingredients: [
        { id: 'ing-condensado', name: 'Leite Condensado', price: 6.50, quantity: 395, unit: 'g', stock: 10 },
        { id: 'ing-farinha', name: 'Farinha de Trigo', price: 5.00, quantity: 1000, unit: 'g', stock: 5 },
      ],
      packagings: [
        { id: 'pkg-pote', name: 'Pote 220ml', price: 12.00, quantity: 10, unit: 'un', stock: 50 }, // 50 pacotes de 10un = 500 potes
        { id: 'pkg-forminha', name: 'Forminha N° 5', price: 8.00, quantity: 100, unit: 'un', stock: 10 }, // 10 pacotes de 100un = 1000 forminhas
      ],
      recipes: [
        {
          id: 'rec-recheio',
          name: 'Recheio de Leite Condensado',
          yieldQuantity: 395,
          yieldUnit: 'g',
          items: [
            { id: 'ri-1', ingredientId: 'ing-condensado', usedQuantity: 395 } // Usa 1 lata inteira (395g)
          ]
        }
      ],
      products: [
        {
          id: 'prod-bolo-pote',
          name: 'Bolo de Pote',
          productionTimeMinutes: 20,
          batchYieldQuantity: 10, // Lote rende 10 potes
          components: [
            { id: 'pc-1', componentId: 'rec-recheio', type: 'recipe', usedQuantity: 395 }, // Usa 1 receita (395g) no lote
            { id: 'pc-2', componentId: 'pkg-pote', type: 'packaging', usedQuantity: 10 }   // Usa 10 potes no lote (1 pacote)
          ]
        }
      ],
      sales: []
    });
  });

  test('Deve deduzir exatamente 1 lata de leite condensado ao preparar 1 receita base que consome 395g', () => {
    const { deductRecipeStock } = useStock();

    // 10 latas em estoque inicialmente
    expect(useAppStore.getState().ingredients[0].stock).toBe(10);

    // Executa a baixa da receita base (multiplicador 1)
    deductRecipeStock('rec-recheio', 1);

    // Deve restar exatamente 9 latas (10 - (395g / 395g))
    expect(useAppStore.getState().ingredients[0].stock).toBe(9);
  });

  test('Deve deduzir proporcionalmente quando a receita base for multiplicada (ex: receita dobrada = 2 latas)', () => {
    const { deductRecipeStock } = useStock();

    // Receita dobrada (m = 2 -> 790g consumidos)
    deductRecipeStock('rec-recheio', 2);

    // 10 - (790g / 395g) = 8 latas
    expect(useAppStore.getState().ingredients[0].stock).toBe(8);
  });

  test('Deve deduzir corretamente estoque de ingredientes e embalagens ao vender/produzir um produto em lote', () => {
    const { deductProductStock } = useStock();

    // Vender 10 potes (1 lote completo)
    deductProductStock('prod-bolo-pote', 10);

    const state = useAppStore.getState();

    // Leite Condensado (via receita no produto): 10 - (395g / 395g) = 9 latas
    expect(state.ingredients[0].stock).toBe(9);

    // Pote 220ml (embalagem): 50 pacotes - (10 potes / 10 por pacote) = 49 pacotes
    expect(state.packagings[0].stock).toBe(49);
  });

  test('Deve deduzir fração proporcional do estoque ao vender fração do lote (ex: 5 potes de um lote de 10)', () => {
    const { deductProductStock } = useStock();

    // Vender 5 potes (metade do lote)
    deductProductStock('prod-bolo-pote', 5);

    const state = useAppStore.getState();

    // Leite Condensado: 10 - 0.5 = 9.5 latas
    expect(state.ingredients[0].stock).toBe(9.5);

    // Pote 220ml: 50 - 0.5 pacote = 49.5 pacotes
    expect(state.packagings[0].stock).toBe(49.5);
  });

  test('Não deve permitir que o estoque fique negativo se o consumo for maior que o saldo disponível', () => {
    const { deductRecipeStock } = useStock();

    // Tentar consumir 20 latas quando só há 10 em estoque
    deductRecipeStock('rec-recheio', 20);

    // O estoque deve travar em 0 (sem ficar negativo)
    expect(useAppStore.getState().ingredients[0].stock).toBe(0);
  });
});
