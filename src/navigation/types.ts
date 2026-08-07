import { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Dashboard: undefined;
  Inventory: undefined;
  Catalog: undefined;
  Sales: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Landing: undefined;
  Main: NavigatorScreenParams<TabParamList> | undefined;
  CreateRecipe: { recipeId?: string } | undefined;
  CreateProduct: { productId?: string } | undefined;
  MarketList: undefined;
};
