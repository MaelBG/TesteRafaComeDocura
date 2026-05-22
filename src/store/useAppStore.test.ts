import { useAppStore } from '../store/useAppStore';

// Mock do AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

describe('useAppStore State Tests', () => {
  beforeEach(() => {
    // Reset o estado do store antes de cada teste se possível
    // No Zustand persist, o estado é mantido, mas para testes unitários 
    // podemos usar o setState diretamente.
    useAppStore.setState({
      ingredients: [],
      recipes: [],
      products: [],
      packagings: [],
      sales: [],
      settings: {
        hourlyRate: 15,
        workerProfile: 'beginner',
        fixedCostsPercent: 15,
        profitMarginPercent: 40,
      }
    });
  });

  test('Deve adicionar um ingrediente corretamente', () => {
    const { addIngredient } = useAppStore.getState();
    addIngredient({ name: 'Açúcar', price: 10, quantity: 1000, unit: 'g', stock: 0 });
    
    const state = useAppStore.getState();
    expect(state.ingredients.length).toBe(1);
    expect(state.ingredients[0].name).toBe('Açúcar');
    expect(state.ingredients[0].id).toBeDefined();
  });

  test('Deve remover um ingrediente corretamente', () => {
    const { addIngredient, removeIngredient } = useAppStore.getState();
    addIngredient({ name: 'Açúcar', price: 10, quantity: 1000, unit: 'g', stock: 0 });
    const id = useAppStore.getState().ingredients[0].id;
    
    removeIngredient(id);
    expect(useAppStore.getState().ingredients.length).toBe(0);
  });

  test('Deve adicionar uma receita corretamente', () => {
    const { addRecipe } = useAppStore.getState();
    addRecipe({
      name: 'Bolo Base',
      yieldQuantity: 1000,
      yieldUnit: 'g',
      items: [{ id: '1', ingredientId: 'ing1', usedQuantity: 500 }]
    });

    const state = useAppStore.getState();
    expect(state.recipes.length).toBe(1);
    expect(state.recipes[0].items.length).toBe(1);
  });

  test('Deve atualizar as configurações corretamente', () => {
    const { updateSettings } = useAppStore.getState();
    updateSettings({ hourlyRate: 20 });
    
    expect(useAppStore.getState().settings.hourlyRate).toBe(20);
    // Deve manter os outros valores
    expect(useAppStore.getState().settings.workerProfile).toBe('beginner');
  });
});
