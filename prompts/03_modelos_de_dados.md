# Estrutura de Dados (Tipagem TS)

Ao criar funções, estados ou simular banco de dados (AsyncStorage/SQLite), utilize obrigatoriamente as seguintes interfaces como base:

```typescript
// Ingrediente comprado no mercado
export interface Ingredient {
  id: string;
  name: string; // ex: Leite Condensado
  packagePrice: number; // ex: 6.00
  packageSize: number; // ex: 395
  unit: 'g' | 'ml' | 'un';
}

// Produto Final (Bolo de Pote)
export interface Product {
  id: string;
  name: string; // ex: Bolo de Pote de Cenoura
  ingredientsUsed: { ingredientId: string; amountUsed: number }[];
  packagingCost: number; // Pote + colher + adesivo
  prepTimeMinutes: number; // Tempo gasto
  yieldAmount: number; // Quantos potes rende
  desiredMargin: number; // Ex: 0.30 (30%)
}