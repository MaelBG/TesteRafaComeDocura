import { useAppStore } from '../store/useAppStore';
import { pricingCalculator } from '../hooks/usePricing';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

describe('Simulação Completa: Do Estoque ao Preço Final', () => {
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
        profitMarginPercent: 40,
      }
    });
  });

  test('Fluxo Completo de Precificação e Fallback de Exclusão', () => {
    const store = useAppStore.getState();

    // 1. COMPRANDO INGREDIENTES E EMBALAGENS
    // Farinha: R$ 5,00 o pacote de 1000g
    store.addIngredient({ name: 'Farinha', price: 5, quantity: 1000, unit: 'g', stock: 10, category: 'Secos' });
    const farinhaId = useAppStore.getState().ingredients[0].id;

    // Pote: R$ 10,00 o pacote com 10 unidades
    store.addPackaging({ name: 'Pote 250ml', price: 10, quantity: 10, unit: 'un', stock: 5, category: 'Acrílico' });
    const poteId = useAppStore.getState().packagings[0].id;

    // 2. FAZENDO A RECEITA BASE
    // Massa Base: Usa 250g de Farinha e rende 500g de Massa.
    store.addRecipe({
      name: 'Massa Base',
      yieldQuantity: 500,
      yieldUnit: 'g',
      category: 'Massas',
      items: [{ id: 'item1', ingredientId: farinhaId, usedQuantity: 250 }]
    });
    const receitaId = useAppStore.getState().recipes[0].id;

    // --- VERIFICAÇÃO MATEMÁTICA DA RECEITA ---
    const calc1 = pricingCalculator(useAppStore.getState());
    // Custo base da farinha usada: (5/1000) * 250 = 1.25
    // Custo real da receita (com 5% de perda): 1.25 * 1.05 = 1.3125
    expect(calc1.getRecipeTotalCost(receitaId)).toBeCloseTo(1.3125, 4);

    // Custo por grama da receita: 1.3125 / 500 = 0.002625
    expect(calc1.getRecipeUnitCost(receitaId)).toBeCloseTo(0.002625, 6);


    // 3. MONTANDO O DOCE FINAL
    // Bolo de Pote: Usa 100g da Massa Base e 1 Pote. Demora 30 minutos.
    store.addProduct({
      name: 'Bolo de Pote Simples',
      productionTimeMinutes: 30,
      components: [
        { id: 'comp1', componentId: receitaId, type: 'recipe', usedQuantity: 100 },
        { id: 'comp2', componentId: poteId, type: 'packaging', usedQuantity: 1 }
      ]
    });
    const produtoFinal = useAppStore.getState().products[0];

    // --- VERIFICAÇÃO MATEMÁTICA DO PRODUTO FINAL ---
    const calc2 = pricingCalculator(useAppStore.getState());
    
    // Custo do conteúdo da receita usada: 100g * 0.002625 = 0.2625
    // Custos Indiretos (12%): 0.2625 * 0.12 = 0.0315
    // Mão de Obra (30min de R$ 15/h): R$ 7.50
    // Custo de Produção = 0.2625 + 0.0315 + 7.50 = 7.794
    expect(calc2.getProductProductionCost(produtoFinal)).toBeCloseTo(7.794, 3);

    // Embalagem: 1 Pote de R$ 1,00 (R$ 10 / 10un)
    // Custo Total (CTU) = Produção (7.794) + Embalagem (1.00) = 8.794
    expect(calc2.getProductUnitCost(produtoFinal)).toBeCloseTo(8.794, 3);

    // Preço Sugerido (Lucro 40%): 8.794 / (1 - 0.40) = 8.794 / 0.6 = 14.6566...
    expect(calc2.getSuggestedPrice(produtoFinal)).toBeCloseTo(14.66, 2);


    // 4. TESTE DE RESILIÊNCIA (EXCLUSÃO DE INGREDIENTE)
    // Se o usuário apagar a farinha da despensa, o app não deve quebrar (fallback para 0).
    useAppStore.getState().removeIngredient(farinhaId);
    
    const calc3 = pricingCalculator(useAppStore.getState());
    const produtoPosExclusao = useAppStore.getState().products[0];
    
    // Sem farinha, a receita custa 0.
    // Custo Conteúdo = 0. Indireto = 0.
    // Mão de obra = 7.50.
    // Produção = 7.50. Embalagem = 1.00. Total = 8.50.
    // Sugerido: 8.50 / 0.6 = 14.166...
    expect(calc3.getProductUnitCost(produtoPosExclusao)).toBeCloseTo(8.50, 2);
    expect(calc3.getSuggestedPrice(produtoPosExclusao)).toBeCloseTo(14.17, 2);
  });
});
