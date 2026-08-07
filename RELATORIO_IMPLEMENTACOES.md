# Rafa com Doçura - Relatório Completo de Especificações e Implementações

> **Data do Documento:** 07 de Agosto de 2026  
> **Escopo:** Precificação Inteligente, Motores de Cálculo de Lote, Gestão Atômica de Estoque, Insumos de Referência com Marcas e Módulo de Balanço da Fornada / Diário de Produção.  
> **Status:** 100% Implementado, Testado com Jest (21/21 testes) e Compilado sem erros no TypeScript.

---

## 📑 Sumário Executivo

O aplicativo **Rafa com Doçura** foi desenvolvido especificamente para confeiteiras(os) autônomas(os) e pequenos negócios de confeitaria (com foco em Bolos de Pote, Centos de Brigadeiro Gourmet, Bolos de Festa e Doces Finos). 

O principal objetivo do sistema é **eliminar a adivinhação financeira e o retrabalho**, automatizando o cálculo de:
1. **Custos reais de insumos e perdas técnicas** (raspa de panela, confeitos caídos, sacos de confeitar).
2. **Custos indiretos** (gás de forno e fogão, energia para batedeiras e refrigeração, água e detergente).
3. **Mão de obra direta e artística** (tempo de preparo e montagem com taxa adicional para decorações elaboradas).
4. **Rateio de embalagens em lotes industriais/artesanais**.
5. **Margem de lucro líquido real** e sugestão automática de **Preço de Venda Comercial**.
6. **Balanço da Fornada do Dia / Diário de Produção** para acompanhamento financeiro de cada fornada.

---

## 1. 🧠 Motores de Cálculo e Perfis de Precificação (*Smart Pricing Profiles*)

### 1.1. Eliminação da Digitação Manual do Preço de Venda
* **Contexto:** Anteriormente, o usuário precisava digitar um valor de venda arbitrário, o que gerava insegurança sobre estar tendo lucro ou prejuízo.
* **Solução:** O aplicativo agora calcula e apresenta em destaque o **Preço Recomendado de Venda**:
  $$\text{Preço Recomendado} = \frac{\text{Custo Total Unitário (CTU)}}{1 - \left(\frac{\text{Margem Desejada \%}}{100}\right)}$$
* O card do doce exibe o **Lucro Limpo no Bolso em Reais (R$)** e a margem percentual real já descontando todos os custos.

---

### 1.2. Perfis Especializados de Precificação (`pricingProfile`)
Diferentes categorias de doces possuem comportamentos físicos, tempos de forno e perdas distintas na cozinha. Implementamos a seguinte matriz de coeficientes:

| Perfil | Aplicação Real na Confeitaria | Fator de Perda ($\text{F}_{\text{perda}}$) | Taxa de Custos Indiretos ($\text{T}_{\text{ind}}$) | Adicional de Mão de Obra |
| :--- | :--- | :---: | :---: | :---: |
| **`bolo_festa`** | Bolos de Andar, Chantininho e Decorados | **15%** (perda no bowl e bicos de confeitar) | **18%** (forno 1h+ e 12h de geladeira) | **+50%** no valor/hora da decoração |
| **`brigadeiro`** | Centos de docinhos e brigadeiros gourmet | **10%** (raspa de panela e confeitos) | **10%** (cocção em panela 20min) | Taxa horária padrão |
| **`bolo_pote`** | Montagem em potes plásticos / taças | **8%** (farelos de fatiamento) | **12%** (forno retangular + refrigeração) | Taxa horária padrão |
| **`macaron`** | Confeitaria técnica de alta precisão | **25%** (triagem térmica e quebra de cascas) | **14%** (forno de precisão) | Taxa horária padrão |
| **`padrao`** | Doces tradicionais, tortas e sobremesas | **5%** padrão | **12%** padrão | Taxa horária padrão |

---

### 1.3. Precificação por Rendimento de Lote (*Batch Yield Pricing*)
Na confeitaria artesanal, massas, recheios e centos de brigadeiro são preparados em bateladas.

#### Equações Implementadas no Hook `usePricing.ts`:
1. **Custo do Conteúdo do Lote com Perda:**
   $$\text{Custo Conteúdo Lote} = (\text{Custo Base dos Ingredientes} \times \text{F}_{\text{perda}}) + \text{Custo das Receitas Base}$$
2. **Custos Indiretos Rateados:**
   $$\text{Custo Indireto Lote} = \text{Custo Conteúdo Lote} \times \text{T}_{\text{ind}}$$
3. **Mão de Obra do Lote:**
   $$\text{Custo Mão de Obra Lote} = \left(\frac{\text{Minutos Produção}}{60} \times \text{Taxa Horária}\right) + \left(\frac{\text{Minutos Decoração}}{60} \times (\text{Taxa Horária} \times 1.5)\right)$$
4. **Custo Unitário de Produção (dividido pelo rendimento do lote):**
   $$\text{Custo Unitário Produção} = \frac{\text{Custo Conteúdo Lote} + \text{Custo Indireto Lote} + \text{Custo Mão de Obra Lote}}{\text{Rendimento do Lote (unidades)}}$$
5. **Custo Unitário de Embalagem:**
   $$\text{Custo Unitário Embalagem} = \frac{\sum (\text{Custo Embalagem no Lote})}{\text{Rendimento do Lote}}$$
6. **Custo Total Unitário Final (CTU):**
   $$\text{CTU} = \text{Custo Unitário Produção} + \text{Custo Unitário Embalagem}$$

---

## 2. 📦 Engenharia de Estoque Atômico e Insumos de Referência

### 2.1. Correção da Baixa de Estoque por Fração de Pacote
* **Diagnóstico do Erro Anterior:** Quando uma receita utilizava 1.975g de Leite Condensado (5 latas de 395g), o sistema subtraía `10 - 1975`, gerando saldo negativo ou travamento na renderização.
* **Correção no Hook `useStock.ts` e `useAppStore.ts`:**
  $$\text{Pacotes Consumidos} = \frac{\text{Gramas Usadas}}{\text{Gramas por Pacote}} = \frac{1975\text{g}}{395\text{g}} = 5\text{ latas}$$
  $$\text{Novo Saldo de Estoque} = \max(0, \text{Estoque Atual} - \text{Pacotes Consumidos}) = 10 - 5 = 5\text{ latas}$$

### 2.2. Baixa Automática no Salvamento de Receitas e Produtos
* **Ao Salvar Receita Base (`CreateRecipeScreen.tsx`):** Ao tocar em *"Salvar Receita"*, o aplicativo já deduz automaticamente do estoque todas as latas e gramas dos ingredientes utilizados.
* **Ao Salvar Doce/Produto (`CreateProductScreen.tsx`):** Ao tocar em *"Salvar Produto"*, o aplicativo já deduz automaticamente as receitas, insumos diretos e embalagens associados ao lote.

### 2.3. Insumos de Referência + Marca Atual
* **Conceito:** O cadastro é pelo nome genérico do insumo (**"Leite Condensado"**, **"Creme de Leite"**, **"Farinha de Trigo"**), contando com um campo opcional de **Marca Atual da Compra** (*Moça*, *Nestlé*, *Piracanjuba*, *Melken*, *Galvanotek*).
* **Vantagem Competitiva:** Se na próxima compra o confeiteiro pagar R$ 5,20 em vez de R$ 6,50, ele apenas atualiza o preço do pacote na Despensa. **Todas as receitas, brigadeiros e bolos recalculam automaticamente seus custos e margens de lucro instantaneamente**, sem nenhum retrabalho de digitação.

### 2.4. Ações Rápidas de Estoque nos Cards (`+` e `-`)
* Adicionados botões de incremento (`+`) e decremento (`-`) diretamente nos cards das telas `IngredientsScreen.tsx` e `PackagingScreen.tsx`.
* Permite dar entrada de 1 pacote ou dar baixa de 1 pacote consumido com 1 toque, sem precisar abrir formulários.

---

## 3. 📊 Novo Módulo: Balanço da Fornada / Diário de Produção

Criamos a tela especializada `ProductionBatchScreen.tsx`, acessível via banner de destaque no Dashboard:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📊 BALANÇO DA FORNADA DO DIA                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ 💰 Faturamento Estimado: R$ 490,00   │ 📈 Lucro Limpo no Bolso: + R$ 277,60 │
├─────────────────────────────────────────────────────────────────────────────┤
│ 🛒 Insumos & Emb.: R$ 142,80  │ ⏱️ Mão de Obra: R$ 52,50 (3h30)  │ Total: R$ 212,40 │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📋 Insumos Gastos:                                                          │
│  • Leite Condensado (Marca: Moça) ➔ 12 latas (4.740g) ➔ R$ 78,00            │
│  • Creme de Leite (Marca: Nestlé) ➔ 6 caixas (1.200g) ➔ R$ 22,80            │
│  • Pote Plástico 220ml (Galvanotek) ➔ 30 unidades ➔ R$ 36,00                │
├─────────────────────────────────────────────────────────────────────────────┤
│ [✓ Salvar Fornada no Diário & Dar Baixa Automática no Estoque]              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Funcionalidades do Módulo:
1. **Seletor de Quantidades (+ / -):** Permite montar a fornada do dia (ex: 30 Bolos de Pote + 100 Brigadeiros Gourmet).
2. **Hero Card de Indicadores Financeiros:**
   * **Faturamento Estimado:** Total bruto previsto para venda de toda a fornada.
   * **Lucro Limpo no Bolso:** Lucro líquido real após todos os descontos de insumos, embalagens, mão de obra e custos fixos.
   * **Insumos & Embalagens Gastos:** Total financeiro gasto na produção.
   * **Mão de Obra & Horas de Cozinha:** Total de horas de produção rateadas.
3. **Tabela de Insumos Consumidos:** Discrimina as marcas, gramas e quantidades exatas de latas e caixas consumidas com os valores monetários individuais.
4. **Ação "Salvar Fornada & Baixar Estoque":** Persiste o registro no Diário de Produção e abate todos os insumos consumidos da despensa em uma única transação atômica.
5. **Aba "Diário de Produção (Histórico)":** Histórico cronológico das produções passadas para comparação de faturamento e lucro ao longo das semanas.

---

## 4. 🎨 Melhorias de UI/UX, Design e Acessibilidade

1. **Aprimoramento de Contraste:**
   * Badges de Categoria: Texto branco `#FFFFFF` sobre fundo `#2B88A8` (garantindo legibilidade em ambientes iluminados da cozinha).
   * Badges de Custo e Marca: Texto `#1A5B70` sobre fundo azul pastel `#E6F4F8`.
2. **Alinhamento em Linha Dedicada (`metaRow`):**
   * As badges de categoria, marca e estoque foram alinhadas em uma linha horizontal padronizada logo abaixo do título de cada card, eliminando desalinhamentos visuais.
3. **Reordenação Intuitiva das Abas do Catálogo (`CatalogScreen.tsx`):**
   * **1º Segmento:** **"Receitas Base"** (Massas, Recheios e Caldas).
   * **2º Segmento:** **"Doces Precificados"** (Bolos de Pote, Centos de Brigadeiro, Bolos Confeitados).
4. **Conjunto Rico de Dados Mockados (Demonstração / Testes):**
   * Criado botão **"Carregar Dados de Teste (Mock)"** na tela de Ajustes (`SettingsScreen.tsx`), permitindo restaurar a qualquer momento uma doceria completa pré-configurada para testes e validação.

---

## 5. 🧪 Qualidade de Código, Testes Automatizados e CI/CD

### 5.1. Esteira de Verificação CI (`npm run ci`)
* **TypeScript:** Compilação estrita com **0 erros** (`tsc --noEmit`).
* **Jest Test Runner:** **100% de aprovação em 21 testes unitários** distribuídos em 6 suítes:
  - `src/hooks/usePricing.test.ts` (precificação, perfis, recálculo por marca e balanço da fornada).
  - `src/hooks/useStock.test.ts` (dedução por fração de lata/pacote, receitas multiplicadas e estoque positivo).
  - `src/store/useAppStore.test.ts` (ações do Zustand e persistência via AsyncStorage).
  - `src/store/integration.test.ts` (integração entre receitas, produtos e despensa).
  - `src/store/e2e.test.ts` (fluxo de ponta a ponta: insumo $\rightarrow$ receita $\rightarrow$ doce $\rightarrow$ venda).
  - `src/store/stock.test.ts` (regras fundamentais de despensa).

### 5.2. Gestão de Branches e Commits
O trabalho foi desenvolvido estritamente em feature branches:
* `feature/perfis-precificacao-doces`: Implementação dos perfis especializados, preço comercial automatizado, rendimento em lote e baixa atômica.
* `feature/balanco-fornada-insumos-referencia`: Implementação dos insumos de referência com marcas, recálculo dinâmico e módulo completo do Balanço da Fornada.

---

## 6. 📁 Estrutura de Arquivos Modificados e Criados

```
TesteRafaComeDocura/
├── App.tsx                                    # Registro da rota ProductionBatch
├── RELATORIO_IMPLEMENTACOES.md                # Este documento executivo
├── src/
│   ├── hooks/
│   │   ├── usePricing.ts                      # Motor de precificação e calculateBatchBalance
│   │   ├── usePricing.test.ts                 # Testes unitários do motor de cálculo
│   │   ├── useStock.ts                        # Hook central de baixa de estoque
│   │   └── useStock.test.ts                   # Testes unitários de dedução de estoque
│   ├── navigation/
│   │   ├── types.ts                           # Tipagem das rotas e navegação
│   │   └── TabNavigator.tsx                   # Barra inferior e opções visuais
│   ├── screens/
│   │   ├── CatalogScreen.tsx                  # Reordenação: 1º Receitas, 2º Doces
│   │   ├── CreateProductScreen.tsx            # Criação de doces com baixa automática
│   │   ├── CreateRecipeScreen.tsx             # Criação de receitas com baixa automática
│   │   ├── DashboardScreen.tsx                # Banner para Balanço da Fornada
│   │   ├── IngredientsScreen.tsx              # Insumos de referência, marca e botões +/-
│   │   ├── PackagingScreen.tsx                # Embalagens, marcas e botões +/-
│   │   ├── ProductionBatchScreen.tsx          # [NOVO] Balanço da Fornada e Diário
│   │   ├── ProductsScreen.tsx                 # Cards com badges alinhadas e metaRow
│   │   ├── RecipesScreen.tsx                  # Receitas base com baixa atômica
│   │   ├── SalesScreen.tsx                    # Vendas com baixa automática no estoque
│   │   └── SettingsScreen.tsx                 # Configurações e botão de carregar mocks
│   └── store/
│       └── useAppStore.ts                     # Estado global Zustand, persistência e modelos
```

---

*Documento gerado e aprovado com sucesso para referência técnica da equipe e do confeiteiro.*
