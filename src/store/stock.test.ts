import { useAppStore } from '../store/useAppStore';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

describe('Stock Management Integration', () => {
  beforeEach(() => {
    useAppStore.setState({
      ingredients: [
        { id: 'i1', name: 'Chocolate', price: 20, quantity: 1000, unit: 'g', stock: 1000 }
      ],
      packagings: [
        { id: 'p1', name: 'Pote', price: 10, quantity: 10, unit: 'un', stock: 50 }
      ],
      products: [
        {
          id: 'prod1',
          name: 'Bolo',
          productionTimeMinutes: 10,
          components: [
            { id: 'c1', componentId: 'i1', type: 'ingredient', usedQuantity: 100 },
            { id: 'c2', componentId: 'p1', type: 'packaging', usedQuantity: 1 }
          ]
        }
      ],
      sales: [],
    });
  });

  test('Deve atualizar estoque ao simular fluxo de venda (lógica da SalesScreen)', () => {
    const state = useAppStore.getState();
    const product = state.products[0];
    const saleQuantity = 5;

    // Simula a lógica implementada na SalesScreen.tsx
    product.components.forEach(comp => {
      const totalUsed = comp.usedQuantity * saleQuantity;
      if (comp.type === 'ingredient') {
        const ing = state.ingredients.find(i => i.id === comp.componentId);
        if (ing) state.updateIngredient(ing.id, { stock: ing.stock - totalUsed });
      } else if (comp.type === 'packaging') {
        const pkg = state.packagings.find(p => p.id === comp.componentId);
        if (pkg) state.updatePackaging(pkg.id, { stock: pkg.stock - totalUsed });
      }
    });

    const updatedState = useAppStore.getState();
    
    // Chocolate: 1000g - (100g * 5) = 500g
    expect(updatedState.ingredients[0].stock).toBe(500);
    
    // Pote: 50u - (1u * 5) = 45u
    expect(updatedState.packagings[0].stock).toBe(45);
  });
});
