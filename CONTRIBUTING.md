# Guia de Contribuição & Fluxo de Branches

Este documento descreve o padrão oficial de desenvolvimento e fluxo de integração de código no projeto **Rafa com Doçura**.

---

## 🌿 Estratégia de Branches (Git Feature Branching)

A branch `master` contém o código estável e pronto para produção. **Nenhum commit direto deve ser feito na `master`.**

### 1. Nomenclatura de Branches
Ao iniciar qualquer tarefa, crie uma nova branch a partir da `master`:

* **Novas Funcionalidades / Telas:** `feature/nome-da-feature`  
  *Ex: `feature/grafico-lucro`, `feature/exportar-pdf`*
* **Correções de Bugs:** `fix/nome-do-bug`  
  *Ex: `fix/calculo-arredondamento-margem`*
* **Melhorias de UI / Refatoração:** `refactor/nome-da-melhoria`  
  *Ex: `refactor/contraste-botoes`*

```bash
# Atualize sua master local
git checkout master
git pull origin master

# Crie e altere para sua nova branch
git checkout -b feature/minha-nova-tela
```

---

## 🧪 Verificação Local Obrigatória

Antes de realizar o `push` para a sua branch remota, execute o comando de verificação automática local:

```bash
npm run ci
```

Este comando irá validar:
1. **Tipagem TypeScript:** `npx tsc --noEmit` (Garante que não há erros de tipagem)
2. **Suíte de Testes:** `npx jest --ci` (Garante que os 13 testes de integração e precificação estão passando)

---

## 🚀 Abrindo um Pull Request (PR)

1. Faça o commit das suas alterações seguindo o padrão [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git add .
   git commit -m "feat(produtos): adiciona campo de preco praticado"
   git push origin feature/minha-nova-tela
   ```

2. Abra o **Pull Request** no GitHub direcionando para a branch `master`.
3. O **GitHub Actions (CI Pipeline)** irá rodar automaticamente os testes e validações de tipos.
4. Assim que os testes passarem (🟢 *Checks passed*), o PR pode ser mesclado (*Merge*) na `master` com segurança!
