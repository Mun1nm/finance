export const TUTORIALS = {
  wallet: {
    id: 'wallet',
    steps: [
      {
        targetId: 'tutorial-wallet-section',
        title: 'Bem-vindo ao Finance!',
        description: 'Esta é a seção de carteiras. Aqui ficam todas as suas contas bancárias e carteiras digitais. Você ainda não tem nenhuma — vamos criar a primeira!',
        position: 'bottom'
      },
      {
        targetId: 'tutorial-create-wallet-btn',
        title: 'Crie sua primeira carteira',
        description: 'Clique em "+ Nova" para adicionar sua primeira carteira. Pode ser sua conta do banco, Nubank, carteira de criptomoedas, etc.',
        position: 'bottom'
      }
    ]
  },
  category: {
    id: 'category',
    steps: [
      {
        targetId: 'tutorial-categories-nav',
        title: 'Organize com Categorias',
        description: 'Categorias ajudam a classificar seus gastos e receitas. Clique aqui para acessar a página de categorias e criar as suas!',
        position: 'bottom'
      }
    ]
  },
  categoryPage: {
    id: 'categoryPage',
    steps: [
      {
        targetId: 'tutorial-category-type-toggle',
        title: 'Saídas e Entradas',
        description: 'Categorias são divididas em dois tipos: Saídas (gastos) e Entradas (receitas). Alterne entre elas para organizar cada tipo separadamente.',
        position: 'bottom'
      },
      {
        targetId: 'tutorial-category-form',
        title: 'Macro e Categoria',
        description: 'A Macro Categoria é um grupo amplo (ex: "Moradia", "Lazer"). A Categoria é mais específica (ex: "Aluguel", "Cinema"). Essa hierarquia ajuda nas análises!',
        position: 'bottom'
      },
      {
        targetId: 'tutorial-category-list',
        title: 'Suas Categorias',
        description: 'Aqui ficam listadas todas as categorias criadas. Você pode editar ou excluir qualquer uma a qualquer momento.',
        position: 'top'
      }
    ]
  }
};
