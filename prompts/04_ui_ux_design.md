# Diretrizes de UI/UX (Design System)

O app "Rafa com Doçura" tem uma identidade visual acolhedora, limpa e artesanal.

## Regras Visuais
1. **Cores Base:** Todos os códigos devem importar e usar o arquivo `src/theme/colors.ts`. Nunca faça hardcode de cores Hexadecimais no meio do componente (ex: `color: '#FF0000'`).
2. **Bordas e Sombras:** Utilize bordas arredondadas (`borderRadius: 8` a `12`) em cartões e botões para dar um aspecto amigável e suave.
3. **Botões:** Botões principais devem ser fáceis de tocar (mínimo de `height: 48`) e ter feedback visual claro (use `TouchableOpacity`).
4. **Textos Focais:** Dê muito destaque (fonte maior e negrito) ao "Lucro Limpo" e "Preço Sugerido" nas telas de resultado, pois é o que o usuário mais quer ver.