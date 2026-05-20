# Rafa com Doçura - Project Context & Instructions

## Project Overview
"Rafa com Doçura" is a mobile application designed to help confectioners (specifically those making "Bolos de Pote" and other sweets) manage their production and accurately price their products. The app calculates ingredient costs, labor (mão de obra), fixed costs (água, luz, etc.), and desired profit margins to suggest an ideal selling price.

## 🧠 Módulos de Conhecimento do Agente

Para realizar qualquer tarefa neste projeto, você deve ler, compreender e aplicar as regras definidas nos módulos abaixo. Se uma regra estiver definida nos módulos, ela é lei e não deve ser ignorada.

@./prompts/01_regras_precificacao.md
@./prompts/02_arquitetura_react_native.md
@./prompts/03_modelos_de_dados.md
@./prompts/04_ui_ux_design.md

**Technologies:**
- **Framework:** React Native with Expo (Managed Workflow, New Architecture enabled).
- **Language:** TypeScript.
- **Navigation:** React Navigation v7 (Native Stack & Bottom Tabs).
- **UI/Styling:** React Native `StyleSheet` (Vanilla).
- **Layout Management:** `react-native-safe-area-context`.

## Directory Structure
- `App.tsx`: The root entry point. Wraps the app in `SafeAreaProvider` and initializes `NavigationContainer`.
- `src/navigation/`: Contains all routing configuration (`TabNavigator.tsx`, `types.ts`).
- `src/screens/`: Contains the application's screens:
  - `LandingPage`: Initial welcome screen.
  - `DashboardScreen`: App overview and quick stats.
  - `IngredientsScreen`: Inventory management and ingredient base costs.
  - `RecipesScreen`: Base recipes (massas, recheios).
  - `ProductsScreen`: Final product assembly and pricing logic.
  - `SettingsScreen`: Configuration for labor, fixed costs, and profit margins.
- `src/theme/`: Contains central design tokens, notably `colors.ts` (pastel and bakery-themed palette).

## Building and Running
The project uses Expo CLI. Key commands defined in `package.json`:

- **Start the bundler:** `npm start` (or `npx expo start`)
- **Run on Android emulator/device:** `npm run android`
- **Run on iOS simulator:** `npm run ios`
- **Run on Web:** `npm run web`

## Development Conventions

### Styling and UI
- **Avoid External UI Libraries:** Prefer standard React Native components (`View`, `Text`, `TouchableOpacity`) and `StyleSheet.create`. Do not use TailwindCSS unless explicitly requested.
- **Theme Consistency:** Always use colors imported from `src/theme/colors.ts` to maintain the pastel/bakery aesthetic.
- **Safe Areas:** The app operates under Edge-to-Edge mode. 
  - The root is wrapped in `SafeAreaProvider`.
  - Use `useSafeAreaInsets` from `react-native-safe-area-context` for calculating dynamic paddings (e.g., in Tab Navigators or custom headers).
  - Use `SafeAreaView` from `react-native-safe-area-context` instead of the standard `react-native` one for full-screen pages.

### Architecture & Typing
- **TypeScript First:** Maintain strict typing. Screens and navigators must be typed using types defined in `src/navigation/types.ts`.
- **Component Structure:** Use functional components with React Hooks.
- **Modularity:** Keep screens focused. Complex logic (like the pricing algorithm) should eventually be abstracted into custom hooks or utility functions as the app grows.
