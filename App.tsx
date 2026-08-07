import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LandingPage from './src/screens/LandingPage';
import TabNavigator from './src/navigation/TabNavigator';
import CreateRecipeScreen from './src/screens/CreateRecipeScreen';
import CreateProductScreen from './src/screens/CreateProductScreen';
import MarketListScreen from './src/screens/MarketListScreen';
import ProductionBatchScreen from './src/screens/ProductionBatchScreen';
import { RootStackParamList } from './src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Landing"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Landing" component={LandingPage} />
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="CreateRecipe" component={CreateRecipeScreen} />
          <Stack.Screen name="CreateProduct" component={CreateProductScreen} />
          <Stack.Screen name="MarketList" component={MarketListScreen} />
          <Stack.Screen name="ProductionBatch" component={ProductionBatchScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
