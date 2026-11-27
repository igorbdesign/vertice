# Vértice 🔮

Painel central pessoal para designers gráficos/webdesigners — clientes, contratos, financeiro, prospecção ativa, kanban de tarefas, conteúdo para redes sociais e mais.

## Como usar

Abra o arquivo `index.html` em qualquer navegador moderno (Chrome, Edge, Firefox). Não há instalação nem build — tudo roda localmente no seu computador.

> Os dados são salvos automaticamente no navegador (localStorage) e persistem entre sessões. Use sempre o mesmo navegador e o mesmo local do arquivo para manter o histórico.

## Módulos

| Módulo | O que faz |
|---|---|
| **Dashboard** | Resumo financeiro, tarefas, metas, hábitos e leads quentes |
| **Tarefas** | Kanban estilo Notion/Trello: colunas personalizáveis (cor + imagem), datas de início/prazo, checklist no card, alertas de atraso configuráveis |
| **Clientes** | Cadastro completo + seu perfil profissional |
| **Contratos** | Minuta padrão editável, cláusulas adicionar/remover, assinatura digital, exportação .doc, previsões 50%/50% automáticas no financeiro |
| **Serviços** | Catálogo do que você presta com preço base e escopo |
| **Financeiro** | Entradas/saídas, custos fixos mensais automáticos, previsão de recebimento, gráficos por mês/ano/cliente/categoria |
| **Metas** | Contador com unidade livre, por etapas ou aprendizado com prazo |
| **Hábitos** | Acompanhamento diário com sequência (streak) |
| **Wishlist** | Desejos com preço, prioridade e status |
| **Projetos** | Projetos pessoais com etapas |
| **Calendário** | Eventos + prazos de tarefas + momentos |
| **Momentos** | Linha do tempo de conquistas e marcos |
| **Prospecção** | Auditoria de sites por nicho/cidade, nota de oportunidade, diagnóstico em linguagem humana, mensagem pronta de WhatsApp e funil de leads |
| **Conteúdo** | Seu tom de voz, gerador de posts, radar de notícias, roteiros de Reels com teleprompter e carrosséis |

## Estrutura

```
index.html          shell do app
css/styles.css      tema (dark suave + roxo claro)
js/store.js         persistência (localStorage) e regras de dados
js/ui.js            helpers de interface e gráficos
js/sidebar.js       menu reordenável
js/alerts.js        central de avisos
js/pages/*.js       um módulo por página
```
