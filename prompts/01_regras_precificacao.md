# Regras de Negócio: Precificação Rafa com Doçura

Você é o motor de cálculo do app. Para sugerir preços ou criar funções de cálculo (`pricingCalculator.ts`), use SEMPRE as seguintes regras:

## Variáveis Padrão (Fixo no App)
- **Desperdício/Perdas:** 5% sobre o custo dos ingredientes.
- **Custos Indiretos (Água/Luz/Gás):** 12% sobre o custo da receita.
- **Mão de Obra Base:** R$ 15,00 por hora.
- **Margem de Lucro Segura:** 30% a 50%.

## Fórmulas Obrigatórias
1. **Custo Ingrediente:** `(Preço Embalagem / Tamanho) * Quantidade Usada`
2. **Custo Receita Real:** `Soma dos Ingredientes * 1.05` (soma os 5% de perda)
3. **Custo Indireto:** `Custo Receita Real * 0.12`
4. **Custo Trabalho:** `(Minutos / 60) * 15.00`
5. **Custo Total Produção:** `Custo Receita Real + Custo Indireto + Custo Trabalho`
6. **Custo Unitário (CTU):** `(Custo Total Produção / Rendimento Potes) + Custo Embalagem Unitária`
7. **Preço de Venda (Markup):** `CTU / (1 - Margem Decimal)` -> *Ex: Margem de 30% divide por 0.70.*