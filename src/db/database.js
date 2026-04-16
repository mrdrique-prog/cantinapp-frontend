// src/db/database.js
import Dexie from 'dexie'

export const db = new Dexie('CantinApp')

db.version(1).stores({
  pessoas:        '++id, nome, telefone, ativo',
  produtos:       '++id, nome, categoria, ativo',
  domingos:       '++id, data',
  cantina_itens:  '++id, domingoId, produtoId',
  vendas:         '++id, pessoaId, domingoId, data, cancelada',
  venda_itens:    '++id, vendaId, produtoId',
  pagamentos:     '++id, pessoaId, data',
  cobranças:      '++id, pessoaId, mesRef, dataEnvio',
  logs:           '++id, acao, tabela, data'
})

// ─── Seed inicial de dados de demonstração ───────────────────────────────────
export async function seedDemoData() {
  const count = await db.pessoas.count()
  if (count > 0) return

  const pessoaIds = await db.pessoas.bulkAdd([
    { nome: 'Maria Rita',    telefone: '11999991234', ativo: true, observacoes: '' },
    { nome: 'João Paulo',    telefone: '11988882345', ativo: true, observacoes: '' },
    { nome: 'Ana Silva',     telefone: '11977773456', ativo: true, observacoes: '' },
    { nome: 'Carlos Ferreira', telefone: '11966664567', ativo: true, observacoes: '' },
    { nome: 'Fernanda Costa', telefone: '11955555678', ativo: true, observacoes: '' },
  ], { allKeys: true })

  const produtoIds = await db.produtos.bulkAdd([
    { nome: 'Coxinha',         categoria: 'Salgados', ativo: true },
    { nome: 'Café',            categoria: 'Bebidas',  ativo: true },
    { nome: 'Suco de Laranja', categoria: 'Bebidas',  ativo: true },
    { nome: 'Bolo de Cenoura', categoria: 'Doces',    ativo: true },
    { nome: 'Água',            categoria: 'Bebidas',  ativo: true },
    { nome: 'Pão de Queijo',   categoria: 'Salgados', ativo: true },
  ], { allKeys: true })

  // Domingos
  const dom1Id = await db.domingos.add({ data: '2025-03-23', descricao: 'Culto 23/03' })
  const dom2Id = await db.domingos.add({ data: '2025-03-30', descricao: 'Culto 30/03' })
  const dom3Id = await db.domingos.add({ data: '2025-04-06', descricao: 'Culto 06/04' })

  const precosDom3 = [5.00, 3.00, 8.00, 6.00, 2.00, 4.50]
  for (let i = 0; i < produtoIds.length; i++) {
    await db.cantina_itens.add({ domingoId: dom3Id, produtoId: produtoIds[i], preco: precosDom3[i] })
  }
  const precosDom2 = [4.50, 3.00, 7.50, 6.00, 2.00, 4.00]
  for (let i = 0; i < produtoIds.length; i++) {
    await db.cantina_itens.add({ domingoId: dom2Id, produtoId: produtoIds[i], preco: precosDom2[i] })
  }

  // Vendas demo
  const v1 = await db.vendas.add({ pessoaId: pessoaIds[0], domingoId: dom3Id, data: '2025-04-06', hora: '10:30', cancelada: false })
  await db.venda_itens.bulkAdd([
    { vendaId: v1, produtoId: produtoIds[0], quantidade: 1, precoUnit: 5.00 },
    { vendaId: v1, produtoId: produtoIds[1], quantidade: 2, precoUnit: 3.00 },
  ])

  const v2 = await db.vendas.add({ pessoaId: pessoaIds[0], domingoId: dom2Id, data: '2025-03-30', hora: '11:00', cancelada: false })
  await db.venda_itens.bulkAdd([
    { vendaId: v2, produtoId: produtoIds[2], quantidade: 1, precoUnit: 7.50 },
    { vendaId: v2, produtoId: produtoIds[3], quantidade: 1, precoUnit: 6.00 },
  ])

  const v3 = await db.vendas.add({ pessoaId: pessoaIds[1], domingoId: dom2Id, data: '2025-03-30', hora: '10:45', cancelada: false })
  await db.venda_itens.bulkAdd([
    { vendaId: v3, produtoId: produtoIds[0], quantidade: 2, precoUnit: 4.50 },
    { vendaId: v3, produtoId: produtoIds[1], quantidade: 1, precoUnit: 3.00 },
  ])

  const v4 = await db.vendas.add({ pessoaId: pessoaIds[2], domingoId: dom3Id, data: '2025-04-06', hora: '09:50', cancelada: false })
  await db.venda_itens.bulkAdd([
    { vendaId: v4, produtoId: produtoIds[5], quantidade: 2, precoUnit: 4.50 },
    { vendaId: v4, produtoId: produtoIds[1], quantidade: 1, precoUnit: 3.00 },
  ])

  // Pagamentos
  await db.pagamentos.add({ pessoaId: pessoaIds[0], valor: 30.00, data: '2025-03-25', forma: 'PIX', observacao: '' })
  await db.pagamentos.add({ pessoaId: pessoaIds[1], valor: 10.00, data: '2025-03-28', forma: 'Dinheiro', observacao: '' })
}
