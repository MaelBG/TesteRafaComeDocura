import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Packaging {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

export interface Ingredient {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

export interface RecipeItem {
  id: string; // id da relação
  ingredientId: string;
  usedQuantity: number;
}

export interface Recipe {
  id: string;
  name: string;
  yieldQuantity: number;
  yieldUnit: string;
  items: RecipeItem[];
}

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
  salary: number;
  hoursPerDay: number;
  daysPerWeek: number;
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

  // Ações Settings
  updateSettings: (settings: Partial<Settings>) => void;
}

// Configuração padrão
const defaultSettings: Settings = {
  salary: 2000,
  hoursPerDay: 8,
  daysPerWeek: 5,
  fixedCostsPercent: 15,
  profitMarginPercent: 40,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ingredients: [],
      recipes: [],
      products: [],
      packagings: [],
      sales: [],
      settings: defaultSettings,

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

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: 'rafa-docura-storage', // Nome da chave no AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
