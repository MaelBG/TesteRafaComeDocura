# 🧁 Rafa com Doçura

**Rafa com Doçura** é um aplicativo mobile focado em gestão e precificação para confeiteiras, com ênfase especial na produção de Bolos de Pote e doces artesanais. O app resolve uma das maiores dores da confeitaria: **calcular corretamente o custo do produto, a mão de obra, os custos fixos e a margem de lucro**.

## ✨ Funcionalidades Principais

O aplicativo é dividido em 6 módulos integrados:

1.  **📊 Dashboard (Resumo):** Painel financeiro mostrando o Faturamento Total, Lucro Líquido, e métricas importantes como total de unidades vendidas e itens cadastrados no estoque. Possui botões de atalho para ações rápidas.
2.  **🍎 Despensa (Ingredientes):** Cadastro de insumos comestíveis (ex: Leite Condensado, Farinha, Cacau em Pó). O app calcula automaticamente o custo fracionado (por grama ou ml) com base no preço pago pela embalagem fechada.
3.  **📦 Embalagens:** Gestão separada para itens não-comestíveis e descartáveis (ex: Potes de acrílico, adesivos, fitas, colheres), calculando o custo por unidade.
4.  **🥘 Receitas Base:** Módulo onde a mágica começa. O usuário junta os ingredientes da Despensa para criar preparações (Massa de Chocolate, Recheio de Ninho, Caldas). Ao informar o rendimento final (peso após preparo), o app calcula o custo real de 1g daquela receita pronta.
5.  **🧁 Produtos Finais:** A montagem final para venda (ex: Bolo de Pote de Ninho com Nutella). Junta-se as Receitas Base, Ingredientes extras (topo) e as Embalagens.
    *   **Calculadora Inteligente:** Além do custo do material, este módulo adiciona o custo da sua Mão de Obra (baseado nos minutos gastos) e os Custos Fixos (água, luz). O app então sugere o **Preço Ideal de Venda** de acordo com a sua meta de lucro.
6.  **🛒 Vendas (Encomendas):** Registro das vendas reais do dia a dia. Ao selecionar um Produto, o app sugere o preço de venda. Após confirmar, o faturamento e o lucro líquido daquela venda vão direto para a Dashboard.
7.  **⚙️ Ajustes:** O coração financeiro do app. Onde a confeiteira define:
    *   Salário desejado por mês.
    *   Dias e horas trabalhadas na semana.
    *   Percentual de custos fixos invariáveis.
    *   Margem de lucro padrão desejada.

## 🚀 Tecnologias Utilizadas

*   **[React Native](https://reactnative.dev/)** com **[Expo](https://expo.dev/)**: Framework para desenvolvimento mobile cross-platform (Android e iOS).
*   **[TypeScript](https://www.typescriptlang.org/)**: Tipagem estática para garantir um código mais seguro e previsível.
*   **[React Navigation (v7)](https://reactnavigation.org/)**: Para o roteamento em abas (Bottom Tabs) e pilhas (Stack).
*   **[Zustand](https://docs.pmnd.rs/zustand/)**: Gerenciamento de estado global super leve, que faz as telas conversarem entre si (ex: alterar um ingrediente afeta o custo do produto final).
*   **[AsyncStorage](https://react-native-async-storage.github.io/async-storage/)**: Integrado ao Zustand para persistir os dados localmente no aparelho do usuário (mesmo se fechar o app, nada se perde).
*   **[Expo Vector Icons](https://docs.expo.dev/guides/icons/)**: Biblioteca de ícones (MaterialCommunityIcons).
*   **React Native Safe Area Context**: Para lidar de forma nativa com as barras de navegação e notch (câmera) dos smartphones modernos, impedindo que o layout "vaze" ou seja cortado.

## 📱 Como Rodar o Projeto

**Pré-requisitos:**
*   Node.js instalado (v18 ou superior recomendado).
*   Aplicativo `Expo Go` instalado no seu celular (Android ou iOS) para testar fisicamente, ou um Emulador Android/iOS configurado no computador.

**Passo a passo:**

1.  Clone este repositório ou baixe o código fonte.
2.  Abra o terminal na pasta raiz do projeto.
3.  Instale as dependências executando:
    ```bash
    npm install
    ```
4.  Inicie o servidor do Expo:
    ```bash
    npm start
    ```
5.  Um QR Code aparecerá no terminal. 
    *   **No Android:** Abra o app Expo Go e escaneie o código.
    *   **No iOS:** Abra a Câmera do iPhone, escaneie o código e clique no link para abrir no Expo Go.
    *   **No Emulador:** Pressione `a` (para Android) ou `i` (para iOS) no terminal.

## 🎨 Design e Estilo
O aplicativo foi projetado com uma interface limpa e amigável para uso intenso (na cozinha), utilizando uma paleta de cores pastéis (Creme, Rosa Pastel, Azul Bebê, Salmão) que remete à confeitaria, focando na clareza dos números financeiros para tomada rápida de decisões.