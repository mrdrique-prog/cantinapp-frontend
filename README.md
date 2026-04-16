# ⛪ CantinApp — Gestão de Cantina de Igreja

Sistema completo para gestão de cantina de igrejas com controle de fiado, cobrança via WhatsApp e relatórios.

## 🚀 Como rodar

### Requisitos
- Node.js 18+
- npm ou yarn

### Instalação

```bash
# Entrar na pasta
cd cantinapp

# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev
```

Acesse: http://localhost:5173

### Build para produção (PWA)

```bash
npm run build
npm run preview
```

---

## 📁 Estrutura do Projeto

```
cantinapp/
├── src/
│   ├── db/
│   │   └── database.js        # Banco de dados IndexedDB (Dexie)
│   ├── store/
│   │   └── useStore.js        # Estado global de navegação (Zustand)
│   ├── hooks/
│   │   └── useData.js         # Todos os hooks de dados (CRUD)
│   ├── components/
│   │   └── UI.jsx             # Componentes reutilizáveis
│   ├── pages/
│   │   ├── Dashboard.jsx      # Tela inicial
│   │   ├── NovaVenda.jsx      # Registrar venda fiada
│   │   ├── Domingos.jsx       # Cantina do dia + preços
│   │   ├── Contas.jsx         # Contas em aberto + extrato + pagamento
│   │   ├── Cobranca.jsx       # Cobrança WhatsApp + relatórios
│   │   └── Pessoas.jsx        # CRUD pessoas e produtos
│   ├── App.jsx                # Roteador principal
│   ├── main.jsx               # Ponto de entrada
│   └── index.css              # Estilos globais
├── index.html
├── vite.config.js
└── package.json
```

---

## ✅ Funcionalidades implementadas

- [x] Dashboard com métricas em tempo real
- [x] Cadastro e gestão de pessoas
- [x] Cadastro e gestão de produtos por categoria
- [x] Cantina do Dia (montar produtos e preços por domingo)
- [x] Copiar cantina do domingo anterior
- [x] Histórico de preços por produto
- [x] Registro de vendas fiadas (múltiplos itens)
- [x] Cálculo de saldo por pessoa em tempo real
- [x] Extrato completo por pessoa
- [x] Registro de pagamentos (parcial ou total)
- [x] Formas de pagamento (PIX, Dinheiro, Cartão, Transferência)
- [x] Cobrança mensal via WhatsApp (mensagem automática)
- [x] Controle de cobranças enviadas
- [x] Relatórios mensais (vendido, recebido, em aberto)
- [x] Taxa de adimplência
- [x] Dados de demonstração ao primeiro acesso
- [x] PWA — instalável no celular como app
- [x] Funciona offline (IndexedDB local)

---

## 🗃️ Banco de Dados (IndexedDB via Dexie)

| Tabela          | Descrição                        |
|-----------------|----------------------------------|
| `pessoas`       | Cadastro de membros              |
| `produtos`      | Itens da cantina                 |
| `domingos`      | Cada culto/domingo               |
| `cantina_itens` | Produtos + preços por domingo    |
| `vendas`        | Cabeçalho de cada venda          |
| `venda_itens`   | Itens de cada venda              |
| `pagamentos`    | Pagamentos registrados           |
| `cobranças`     | Histórico de cobranças WhatsApp  |
| `logs`          | Auditoria de ações               |

---

## 📱 Instalar como app no celular

1. Acesse no Chrome mobile
2. Toque nos 3 pontos → "Adicionar à tela inicial"
3. O app funciona offline!

---

## 🔜 Próximos passos (Fase 2)

- [ ] Backend Node.js + PostgreSQL (multi-dispositivo)
- [ ] Exportação real PDF/Excel
- [ ] Integração WhatsApp Business API
- [ ] Foto das pessoas
- [ ] Sistema de usuários e permissões
- [ ] Sincronização em nuvem
