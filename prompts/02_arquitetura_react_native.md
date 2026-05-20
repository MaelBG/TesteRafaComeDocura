# Diretrizes Técnicas: React Native & TypeScript

Sempre que gerar código para o "Rafa com Doçura", respeite rigorosamente este padrão:

## Stack Tecnológico
- **Framework:** Expo (React Native).
- **Linguagem:** TypeScript estrito. Sem uso de `any`.
- **Estilização:** `StyleSheet.create` nativo. PROIBIDO usar TailwindCSS ou Styled Components.

## Padrões de Código
1. **Componentes Funcionais:** Use sempre *Arrow Functions* com React Hooks.
2. **Separação de Lógica:** Se um componente tiver mais de 3 funções de cálculo ou manipulação de estado, extraia para um Custom Hook na pasta `src/hooks/`.
3. **Navegação:** Use `@react-navigation/native` v7. Tipagem rigorosa das rotas deve vir de `src/navigation/types.ts`.
4. **Safe Area:** Toda tela principal deve usar `SafeAreaView` do pacote `react-native-safe-area-context` para evitar sobreposição em entalhes de tela (Notch/Dynamic Island).