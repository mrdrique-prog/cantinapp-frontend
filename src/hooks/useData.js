// src/hooks/useData.js
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ─── PESSOAS ─────────────────────────────────────────────────────────────────
export function usePessoas() {
  return useLiveQuery(() => db.pessoas.where('ativo').equals(1).sortBy('nome'), [])
}

export function usePessoa(id) {
  return useLiveQuery(() => id ? db.pessoas.get(id) : null, [id])
}

export async function salvarPessoa(dados) {
  if (dados.id) {
    await db.pessoas.update(dados.id, dados)
    return dados.id
  }
  return await db.pessoas.add({ ...dados, ativo: true })
}

export async function getSaldoPessoa(pessoaId) {
  const vendas = await db.vendas.where('pessoaId').equals(pessoaId).filter(v => !v.cancelada).toArray()
  let totalCompras = 0
  for (const venda of vendas) {
    const itens = await db.venda_itens.where('vendaId').equals(venda.id).toArray()
    totalCompras += itens.reduce((s, i) => s + i.quantidade * i.precoUnit, 0)
  }
  const pagamentos = await db.pagamentos.where('pessoaId').equals(pessoaId).toArray()
  const totalPago = pagamentos.reduce((s, p) => s + p.valor, 0)
  return +(totalCompras - totalPago).toFixed(2)
}

export function useSaldoPessoa(pessoaId) {
  return useLiveQuery(async () => {
    if (!pessoaId) return 0
    return getSaldoPessoa(pessoaId)
  }, [pessoaId])
}

// ─── PRODUTOS ────────────────────────────────────────────────────────────────
export function useProdutos() {
  return useLiveQuery(() => db.produtos.where('ativo').equals(1).sortBy('nome'), [])
}

export async function salvarProduto(dados) {
  if (dados.id) {
    await db.produtos.update(dados.id, dados)
    return dados.id
  }
  return await db.produtos.add({ ...dados, ativo: true })
}

// ─── DOMINGOS ────────────────────────────────────────────────────────────────
export function useDomingos() {
  return useLiveQuery(() => db.domingos.orderBy('data').reverse().toArray(), [])
}

export function useDomingo(id) {
  return useLiveQuery(() => id ? db.domingos.get(id) : null, [id])
}

export function useCantinaItens(domingoId) {
  return useLiveQuery(async () => {
    if (!domingoId) return []
    const itens = await db.cantina_itens.where('domingoId').equals(domingoId).toArray()
    return Promise.all(itens.map(async item => ({
      ...item,
      produto: await db.produtos.get(item.produtoId)
    })))
  }, [domingoId])
}

export async function criarDomingo(data, descricao = '') {
  return await db.domingos.add({ data, descricao })
}

export async function salvarCantinaItens(domingoId, itens) {
  await db.cantina_itens.where('domingoId').equals(domingoId).delete()
  for (const item of itens) {
    await db.cantina_itens.add({ domingoId, produtoId: item.produtoId, preco: item.preco })
  }
}

export async function copiarDomingoAnterior(domingoIdDestino) {
  const todos = await db.domingos.orderBy('data').reverse().toArray()
  const anterior = todos.find(d => d.id !== domingoIdDestino)
  if (!anterior) return []
  const itens = await db.cantina_itens.where('domingoId').equals(anterior.id).toArray()
  return itens.map(i => ({ produtoId: i.produtoId, preco: i.preco }))
}

export async function getUltimoPreco(produtoId) {
  const itens = await db.cantina_itens.where('produtoId').equals(produtoId).toArray()
  if (!itens.length) return null
  const ids = itens.map(i => i.domingoId)
  const domingos = await db.domingos.bulkGet(ids)
  let maiorData = null, precoRec = null
  domingos.forEach((d, idx) => {
    if (d && (!maiorData || d.data > maiorData)) {
      maiorData = d.data
      precoRec = itens[idx].preco
    }
  })
  return precoRec
}

// ─── VENDAS ──────────────────────────────────────────────────────────────────
export function useVendasPessoa(pessoaId) {
  return useLiveQuery(async () => {
    if (!pessoaId) return []
    const vendas = await db.vendas.where('pessoaId').equals(pessoaId).filter(v => !v.cancelada).toArray()
    return Promise.all(vendas.map(async v => ({
      ...v,
      domingo: await db.domingos.get(v.domingoId),
      itens: await Promise.all(
        (await db.venda_itens.where('vendaId').equals(v.id).toArray())
          .map(async i => ({ ...i, produto: await db.produtos.get(i.produtoId) }))
      ),
      total: (await db.venda_itens.where('vendaId').equals(v.id).toArray())
        .reduce((s, i) => s + i.quantidade * i.precoUnit, 0)
    }))).then(r => r.sort((a, b) => b.data.localeCompare(a.data)))
  }, [pessoaId])
}

export function useVendasDomingo(domingoId) {
  return useLiveQuery(async () => {
    if (!domingoId) return []
    return db.vendas.where('domingoId').equals(domingoId).filter(v => !v.cancelada).toArray()
  }, [domingoId])
}

export async function registrarVenda(pessoaId, domingoId, itens) {
  const agora = new Date()
  const vendaId = await db.vendas.add({
    pessoaId,
    domingoId,
    data: format(agora, 'yyyy-MM-dd'),
    hora: format(agora, 'HH:mm'),
    cancelada: false
  })
  for (const item of itens) {
    if (item.quantidade > 0) {
      await db.venda_itens.add({ vendaId, produtoId: item.produtoId, quantidade: item.quantidade, precoUnit: item.preco })
    }
  }
  await db.logs.add({ acao: 'VENDA', tabela: 'vendas', registroId: vendaId, data: agora.toISOString() })
  return vendaId
}

export async function cancelarVenda(vendaId) {
  await db.vendas.update(vendaId, { cancelada: true })
  await db.logs.add({ acao: 'CANCELAMENTO', tabela: 'vendas', registroId: vendaId, data: new Date().toISOString() })
}

// ─── PAGAMENTOS ──────────────────────────────────────────────────────────────
export function usePagamentosPessoa(pessoaId) {
  return useLiveQuery(async () => {
    if (!pessoaId) return []
    return db.pagamentos.where('pessoaId').equals(pessoaId).reverse().sortBy('data')
  }, [pessoaId])
}

export async function registrarPagamento(pessoaId, valor, forma, observacao = '') {
  const id = await db.pagamentos.add({
    pessoaId, valor: +valor, forma, observacao,
    data: format(new Date(), 'yyyy-MM-dd')
  })
  await db.logs.add({ acao: 'PAGAMENTO', tabela: 'pagamentos', registroId: id, data: new Date().toISOString() })
  return id
}

// ─── RELATÓRIOS ──────────────────────────────────────────────────────────────
export function useResumoMes(mes) {
  return useLiveQuery(async () => {
    if (!mes) return null
    const [ano, m] = mes.split('-')
    const prefix = `${ano}-${m}`

    const vendas = await db.vendas.filter(v => !v.cancelada && v.data.startsWith(prefix)).toArray()
    let totalVendido = 0
    for (const v of vendas) {
      const itens = await db.venda_itens.where('vendaId').equals(v.id).toArray()
      totalVendido += itens.reduce((s, i) => s + i.quantidade * i.precoUnit, 0)
    }

    const pagtos = await db.pagamentos.filter(p => p.data.startsWith(prefix)).toArray()
    const totalRecebido = pagtos.reduce((s, p) => s + p.valor, 0)

    return { totalVendido: +totalVendido.toFixed(2), totalRecebido: +totalRecebido.toFixed(2), qtdVendas: vendas.length }
  }, [mes])
}

export function useDevedores() {
  return useLiveQuery(async () => {
    const pessoas = await db.pessoas.where('ativo').equals(1).toArray()
    const result = await Promise.all(pessoas.map(async p => ({
      ...p,
      saldo: await getSaldoPessoa(p.id)
    })))
    return result.filter(p => p.saldo > 0).sort((a, b) => b.saldo - a.saldo)
  }, [])
}

// ─── COBRANÇAS ───────────────────────────────────────────────────────────────
export async function registrarCobranca(pessoaId, mesRef, valor) {
  return await db.cobranças.add({
    pessoaId, mesRef, valor,
    dataEnvio: format(new Date(), 'yyyy-MM-dd'),
    status: 'enviada'
  })
}

export function useCobranças(mesRef) {
  return useLiveQuery(async () => {
    if (!mesRef) return []
    return db.cobranças.where('mesRef').equals(mesRef).toArray()
  }, [mesRef])
}
