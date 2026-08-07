import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Packaging {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  stock: number;
  category?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  stock: number;
  category?: string;
}

export interface RecipeItem {
  id: string;
  ingredientId: string;
  usedQuantity: number;
}

export interface Recipe {
  id: string;
  name: string;
  yieldQuantity: number;
  yieldUnit: string;
  items: RecipeItem[];
  category?: string;
}

export type PricingProfileType = 'bolo_festa' | 'brigadeiro' | 'bolo_pote' | 'macaron' | 'padrao';

export interface ProductComponent {
  id: string; // id da relação
  componentId: string; // pode ser ingredient, recipe ou package
  type: 'ingredient' | 'recipe' | 'packaging';
  usedQuantity: number;
}

export interface Product {
  id: string;
  name: string;
  productionTimeMinutes: number;
  decorationTimeMinutes?: number;
  pricingProfile?: PricingProfileType;
  batchYieldQuantity?: number;
  targetWeightKg?: number;
  actualSellingPrice?: number;
  components: ProductComponent[];
}

export interface Sale {
  id: string;
  productId: string;
  quantity: number;
  salePrice: number; // Preço unitário pelo qual foi vendido
  date: string; // ISO date string
}

export interface Settings {
  hourlyRate: number;
  workerProfile: 'beginner' | 'professional' | 'expert';
  fixedCostsPercent: number;
  profitMarginPercent: number;
}

interface AppState {
  ingredients: Ingredient[];
  recipes: Recipe[];
  products: Product[];
  packagings: Packaging[];
  sales: Sale[];
  settings: Settings;
  
  // Ações Ingredientes
  addIngredient: (ingredient: Omit<Ingredient, 'id'>) => void;
  removeIngredient: (id: string) => void;
  updateIngredient: (id: string, data: Partial<Ingredient>) => void;

  // Ações Embalagens
  addPackaging: (packaging: Omit<Packaging, 'id'>) => void;
  removePackaging: (id: string) => void;
  updatePackaging: (id: string, data: Partial<Packaging>) => void;

  // Ações Receitas
  addRecipe: (recipe: Omit<Recipe, 'id'>) => void;
  removeRecipe: (id: string) => void;
  updateRecipe: (id: string, data: Partial<Recipe>) => void;

  // Ações Produtos
  addProduct: (product: Omit<Product, 'id'>) => void;
  removeProduct: (id: string) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;

  // Ações Vendas
  addSale: (sale: Omit<Sale, 'id'>) => void;
  removeSale: (id: string) => void;

  // Ações de Baixa de Estoque Atômicas
  deductRecipeStock: (recipeId: string, multiplier?: number) => void;
  deductProductStock: (productId: string, quantity?: number) => void;
  deductRecipeItems: (items: RecipeItem[], multiplier?: number) => void;
  deductProductComponents: (components: ProductComponent[], batchYield?: number) => void;

  // Ações Settings
  updateSettings: (settings: Partial<Settings>) => void;

  // Restaurar / Carregar Dados de Teste
  loadMockData: () => void;
}

// Configuração padrão
const defaultSettings: Settings = {
  hourlyRate: 15,
  workerProfile: 'beginner',
  fixedCostsPercent: 12,
  profitMarginPercent: 40,
};

// Dados Mockados para Demonstração e Testes
export const mockIngredients: Ingredient[] = [
  { id: 'ing-1', name: 'Leite Condensado Moça', price: 6.50, quantity: 395, unit: 'g', stock: 10, category: 'Laticínios' },
  { id: 'ing-2', name: 'Creme de Leite Nestlé', price: 3.80, quantity: 200, unit: 'g', stock: 15, category: 'Laticínios' },
  { id: 'ing-3', name: 'Chocolate em Pó 50% Melken', price: 22.00, quantity: 500, unit: 'g', stock: 5, category: 'Chocolates' },
  { id: 'ing-4', name: 'Leite em Pó Ninho', price: 18.50, quantity: 400, unit: 'g', stock: 4, category: 'Laticínios' },
  { id: 'ing-5', name: 'Farinha de Trigo Rosa Branca', price: 5.20, quantity: 1000, unit: 'g', stock: 8, category: 'Secos' },
  { id: 'ing-6', name: 'Granulado Gourmet Cacau 32%', price: 28.00, quantity: 500, unit: 'g', stock: 3, category: 'Confeitos' },
];

export const mockPackagings: Packaging[] = [
  { id: 'pkg-1', name: 'Pote Plástico c/ Tampa 220ml', price: 12.00, quantity: 10, unit: 'un', stock: 50, category: 'Potes' },
  { id: 'pkg-2', name: 'Forminha N° 5 Pétala Rosa', price: 8.00, quantity: 100, unit: 'un', stock: 200, category: 'Forminhas' },
  { id: 'pkg-3', name: 'Cakeboard MDF 25cm', price: 10.00, quantity: 1, unit: 'un', stock: 5, category: 'Suportes' },
  { id: 'pkg-4', name: 'Caixa para Bolo 25x25x20cm', price: 15.00, quantity: 1, unit: 'un', stock: 5, category: 'Caixas' },
];

export const mockRecipes: Recipe[] = [
  {
    id: 'rec-1',
    name: 'Massa Pão de Ló Baunilha',
    yieldQuantity: 1000,
    yieldUnit: 'g',
    category: 'Massas',
    items: [
      { id: 'ri-1', ingredientId: 'ing-5', usedQuantity: 400 },
    ]
  },
  {
    id: 'rec-2',
    name: 'Recheio Brigadeiro Ninho',
    yieldQuantity: 600,
    yieldUnit: 'g',
    category: 'Recheios',
    items: [
      { id: 'ri-2', ingredientId: 'ing-1', usedQuantity: 395 },
      { id: 'ri-3', ingredientId: 'ing-2', usedQuantity: 200 },
      { id: 'ri-4', ingredientId: 'ing-4', usedQuantity: 100 },
    ]
  },
  {
    id: 'rec-3',
    name: 'Recheio Brigadeiro Cacau',
    yieldQuantity: 600,
    yieldUnit: 'g',
    category: 'Recheios',
    items: [
      { id: 'ri-5', ingredientId: 'ing-1', usedQuantity: 395 },
      { id: 'ri-6', ingredientId: 'ing-2', usedQuantity: 200 },
      { id: 'ri-7', ingredientId: 'ing-3', usedQuantity: 50 },
    ]
  }
];

export const mockProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Bolo de Pote Ninho c/ Brigadeiro',
    productionTimeMinutes: 15,
    pricingProfile: 'bolo_pote',
    batchYieldQuantity: 15,
    components: [
      { id: 'pc-1', componentId: 'rec-1', type: 'recipe', usedQuantity: 400 },
      { id: 'pc-2', componentId: 'rec-2', type: 'recipe', usedQuantity: 300 },
      { id: 'pc-3', componentId: 'rec-3', type: 'recipe', usedQuantity: 300 },
      { id: 'pc-4', componentId: 'pkg-1', type: 'packaging', usedQuantity: 15 },
    ]
  },
  {
    id: 'prod-2',
    name: 'Cento de Brigadeiro Gourmet',
    productionTimeMinutes: 45,
    pricingProfile: 'brigadeiro',
    batchYieldQuantity: 100,
    components: [
      { id: 'pc-5', componentId: 'rec-3', type: 'recipe', usedQuantity: 600 },
      { id: 'pc-6', componentId: 'ing-6', type: 'ingredient', usedQuantity: 200 },
      { id: 'pc-7', componentId: 'pkg-2', type: 'packaging', usedQuantity: 100 },
    ]
  },
  {
    id: 'prod-3',
    name: 'Bolo Ninho Confeitado (2Kg)',
    productionTimeMinutes: 45,
    decorationTimeMinutes: 30,
    pricingProfile: 'bolo_festa',
    batchYieldQuantity: 1,
    targetWeightKg: 2.0,
    components: [
      { id: 'pc-8', componentId: 'rec-1', type: 'recipe', usedQuantity: 600 },
      { id: 'pc-9', componentId: 'rec-2', type: 'recipe', usedQuantity: 600 },
      { id: 'pc-10', componentId: 'pkg-3', type: 'packaging', usedQuantity: 1 },
      { id: 'pc-11', componentId: 'pkg-4', type: 'packaging', usedQuantity: 1 },
    ]
  }
];

export const mockSales: Sale[] = [
  { id: 'sale-1', productId: 'prod-1', quantity: 5, salePrice: 10.00, date: new Date().toISOString() },
  { id: 'sale-2', productId: 'prod-2', quantity: 1, salePrice: 120.00, date: new Date().toISOString() },
];

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ingredients: mockIngredients,
      recipes: mockRecipes,
      products: mockProducts,
      packagings: mockPackagings,
      sales: mockSales,
      settings: defaultSettings,

      loadMockData: () => set({
        ingredients: mockIngredients,
        recipes: mockRecipes,
        products: mockProducts,
        packagings: mockPackagings,
        sales: mockSales,
        settings: defaultSettings,
      }),

      addIngredient: (ingredient) => 
        set((state) => ({
          ingredients: [{ id: Date.now().toString(), ...ingredient }, ...state.ingredients],
        })),

      removeIngredient: (id) =>
        set((state) => ({
          ingredients: state.ingredients.filter((i) => i.id !== id),
        })),

      updateIngredient: (id, data) =>
        set((state) => ({
          ingredients: state.ingredients.map((i) => (i.id === id ? { ...i, ...data } : i)),
        })),

      addPackaging: (packaging) => 
        set((state) => ({
          packagings: [{ id: Date.now().toString(), ...packaging }, ...state.packagings],
        })),

      removePackaging: (id) =>
        set((state) => ({
          packagings: state.packagings.filter((i) => i.id !== id),
        })),

      updatePackaging: (id, data) =>
        set((state) => ({
          packagings: state.packagings.map((i) => (i.id === id ? { ...i, ...data } : i)),
        })),

      addRecipe: (recipe) =>
        set((state) => ({
          recipes: [{ id: Date.now().toString(), ...recipe }, ...state.recipes],
        })),

      removeRecipe: (id) =>
        set((state) => ({
          recipes: state.recipes.filter((r) => r.id !== id),
        })),
        
      updateRecipe: (id, data) =>
        set((state) => ({
          recipes: state.recipes.map((r) => (r.id === id ? { ...r, ...data } : r)),
        })),

      addProduct: (product) =>
        set((state) => ({
          products: [{ id: Date.now().toString(), ...product }, ...state.products],
        })),

      removeProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),

      updateProduct: (id, data) =>
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),

      addSale: (sale) =>
        set((state) => ({
          sales: [{ id: Date.now().toString(), ...sale }, ...state.sales],
        })),

      removeSale: (id) =>
        set((state) => ({
          sales: state.sales.filter((s) => s.id !== id),
        })),

      // Dedução Atômica de Estoque por Produção de Receita Base
      deductRecipeStock: (recipeId: string, multiplier: number = 1) =>
        set((state) => {
          const recipe = state.recipes.find((r) => r.id === recipeId);
          if (!recipe) return state;

          const updatedIngredients = state.ingredients.map((ing) => {
            const item = recipe.items.find((ri) => ri.ingredientId === ing.id);
            if (!item || !ing.quantity || ing.quantity <= 0) return ing;

            const totalGramsUsed = (item.usedQuantity || 0) * multiplier;
            const packagesUsed = totalGramsUsed / ing.quantity;
            const newStock = Math.max(0, (ing.stock || 0) - packagesUsed);
            return { ...ing, stock: parseFloat(newStock.toFixed(2)) };
          });

          return { ingredients: updatedIngredients };
        }),

      // Dedução Atômica de Estoque por Venda ou Produção de Produto Final
      deductProductStock: (productId: string, quantity: number = 1) =>
        set((state) => {
          const product = state.products.find((p) => p.id === productId);
          if (!product) return state;

          const batchYield = (product.batchYieldQuantity && product.batchYieldQuantity > 0) ? product.batchYieldQuantity : 1;
          const usageRatio = quantity / batchYield;

          // 1. Atualizar Ingredientes Diretos e de Receitas
          let updatedIngredients = [...state.ingredients];

          product.components.forEach((comp) => {
            if (comp.type === 'ingredient') {
              updatedIngredients = updatedIngredients.map((ing) => {
                if (ing.id !== comp.componentId || !ing.quantity || ing.quantity <= 0) return ing;
                const totalGramsUsed = comp.usedQuantity * usageRatio;
                const packagesUsed = totalGramsUsed / ing.quantity;
                const newStock = Math.max(0, (ing.stock || 0) - packagesUsed);
                return { ...ing, stock: parseFloat(newStock.toFixed(2)) };
              });
            } else if (comp.type === 'recipe') {
              const recipe = state.recipes.find((r) => r.id === comp.componentId);
              if (recipe && recipe.yieldQuantity > 0) {
                const totalRecipeYieldUsed = comp.usedQuantity * usageRatio;
                const recipeUsageFactor = totalRecipeYieldUsed / recipe.yieldQuantity;

                recipe.items.forEach((item) => {
                  updatedIngredients = updatedIngredients.map((ing) => {
                    if (ing.id !== item.ingredientId || !ing.quantity || ing.quantity <= 0) return ing;
                    const totalGramsUsed = item.usedQuantity * recipeUsageFactor;
                    const packagesUsed = totalGramsUsed / ing.quantity;
                    const newStock = Math.max(0, (ing.stock || 0) - packagesUsed);
                    return { ...ing, stock: parseFloat(newStock.toFixed(2)) };
                  });
                });
              }
            }
          });

          // 2. Atualizar Embalagens
          let updatedPackagings = [...state.packagings];
          product.components.forEach((comp) => {
            if (comp.type === 'packaging') {
              updatedPackagings = updatedPackagings.map((pkg) => {
                if (pkg.id !== comp.componentId || !pkg.quantity || pkg.quantity <= 0) return pkg;
                const totalUnitsUsed = comp.usedQuantity * usageRatio;
                const packagesUsed = totalUnitsUsed / pkg.quantity;
                const newStock = Math.max(0, (pkg.stock || 0) - packagesUsed);
                return { ...pkg, stock: parseFloat(newStock.toFixed(2)) };
              });
            }
          });

          return {
            ingredients: updatedIngredients,
            packagings: updatedPackagings,
          };
        }),

      // Dedução direta ao salvar itens de receita
      deductRecipeItems: (items: RecipeItem[], multiplier: number = 1) =>
        set((state) => {
          let updatedIngredients = [...state.ingredients];
          items.forEach((item) => {
            updatedIngredients = updatedIngredients.map((ing) => {
              if (ing.id !== item.ingredientId || !ing.quantity || ing.quantity <= 0) return ing;
              const totalGramsUsed = (item.usedQuantity || 0) * multiplier;
              const packagesUsed = totalGramsUsed / ing.quantity;
              const newStock = Math.max(0, (ing.stock || 0) - packagesUsed);
              return { ...ing, stock: parseFloat(newStock.toFixed(2)) };
            });
          });
          return { ingredients: updatedIngredients };
        }),

      // Dedução direta ao salvar componentes de produto
      deductProductComponents: (components: ProductComponent[], batchYield: number = 1) =>
        set((state) => {
          let updatedIngredients = [...state.ingredients];
          let updatedPackagings = [...state.packagings];

          components.forEach((comp) => {
            if (comp.type === 'ingredient') {
              updatedIngredients = updatedIngredients.map((ing) => {
                if (ing.id !== comp.componentId || !ing.quantity || ing.quantity <= 0) return ing;
                const totalGramsUsed = comp.usedQuantity;
                const packagesUsed = totalGramsUsed / ing.quantity;
                const newStock = Math.max(0, (ing.stock || 0) - packagesUsed);
                return { ...ing, stock: parseFloat(newStock.toFixed(2)) };
              });
            } else if (comp.type === 'packaging') {
              updatedPackagings = updatedPackagings.map((pkg) => {
                if (pkg.id !== comp.componentId || !pkg.quantity || pkg.quantity <= 0) return pkg;
                const totalUnitsUsed = comp.usedQuantity;
                const packagesUsed = totalUnitsUsed / pkg.quantity;
                const newStock = Math.max(0, (pkg.stock || 0) - packagesUsed);
                return { ...pkg, stock: parseFloat(newStock.toFixed(2)) };
              });
            } else if (comp.type === 'recipe') {
              const recipe = state.recipes.find((r) => r.id === comp.componentId);
              if (recipe && recipe.yieldQuantity > 0) {
                const recipeUsageFactor = comp.usedQuantity / recipe.yieldQuantity;

                recipe.items.forEach((item) => {
                  updatedIngredients = updatedIngredients.map((ing) => {
                    if (ing.id !== item.ingredientId || !ing.quantity || ing.quantity <= 0) return ing;
                    const totalGramsUsed = item.usedQuantity * recipeUsageFactor;
                    const packagesUsed = totalGramsUsed / ing.quantity;
                    const newStock = Math.max(0, (ing.stock || 0) - packagesUsed);
                    return { ...ing, stock: parseFloat(newStock.toFixed(2)) };
                  });
                });
              }
            }
          });

          return {
            ingredients: updatedIngredients,
            packagings: updatedPackagings,
          };
        }),

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: 'rafa-docura-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
