# Gerenciador Financeiro Pessoal

Repositório: https://github.com/Mun1nm/finance

Uma aplicação web (SPA) desenvolvida para controle financeiro pessoal, focada em resolver a lacuna entre o gerenciamento de fluxo de caixa mensal e o acompanhamento de patrimônio e investimentos.

O projeto foi construído para atender a necessidades específicas de usabilidade que aplicativos comerciais muitas vezes ignoram, como o controle detalhado de reembolsos de terceiros e a distinção contábil entre aporte de investimento (saída de caixa) e rentabilidade (valorização de ativo).

## Principais Funcionalidades

### Gestão de Fluxo de Caixa
- Controle de Entradas e Saídas com categorização detalhada.
- Suporte a Macro-categorias para agrupamento lógico de despesas.
- Gestão de despesas recorrentes (assinaturas e custos fixos).

### Módulo de Investimentos (Asset Management)
- Sistema dedicado para controle de patrimônio (Ativos).
- Integração inteligente com a Dashboard:
  - Novos aportes são registrados automaticamente como saída no fluxo de caixa.
  - Atualizações de rentabilidade/saldo afetam apenas o patrimônio total, sem distorcer o saldo disponível em conta corrente.
- Histórico de evolução patrimonial e cálculo de rentabilidade percentual por ativo.

### Controle de Reembolsos (Contas a Receber)
- Funcionalidade para marcar despesas como "Reembolsáveis" (ex: pagamentos feitos em nome de terceiros).
- Aba dedicada para monitoramento de dívidas pendentes.
- Alteração de status e baixa de pagamentos, com ajuste automático do saldo ao receber o reembolso.

### Visualização e Análise
- Dashboard com resumo financeiro: Saldo em Conta, Fluxo Mensal e Patrimônio Total.
- Gráficos de distribuição de gastos por categoria.
- Listagem de transações com agrupamento dinâmico por Data ou por Macro Categoria.

## Stack Tecnológica

- Frontend: React.js com Vite
- Estilização: Tailwind CSS
- Backend as a Service (BaaS): Firebase
  - Authentication: Gestão de usuários.
  - Firestore Database: Banco de dados NoSQL em tempo real.
- Bibliotecas: Recharts (visualização de dados), Lucide React (ícones), React Router DOM (navegação).

## Segurança e Privacidade

Apesar de ser um projeto de código aberto, a segurança dos dados é garantida através de regras de segurança estritas no Firestore (Security Rules).

A lógica implementada no backend assegura que todas as operações de leitura e escrita sejam permitidas exclusivamente se o ID do usuário autenticado corresponder ao proprietário do documento. Isso garante isolamento total dos dados financeiros, mesmo em um ambiente de banco de dados compartilhado.