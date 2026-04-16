// src/pages/Domingos.jsx
import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { TopBar, BtnPrimario, BtnOutline, SectionTitle, formatMoeda, formatData } from '../components/UI'
import { format } from 'date-fns'

const API = 'http://localhost:3001/api'
function getToken() { return localStorage.getItem('cantinapp_token') }
async function apiGet(path) {
  const res = await fetch(API + path, { headers: { 'Authorization': `Bearer ${getToken()}` } })
  return res.json()
}
async function apiPost(path, body) {
  const res = await fetch(API + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify(body)
  })
  return res.json()
}
async function apiPut(path, body) {
  const res = await fetch(API + path, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify(body)
  })
  return res.json()
}

export default function Domingos() {
  const { ir } = useStore()
  const [domingos, setDomingos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [criando, setCriando] = useState(false)

  useEffect(() => {
    apiGet('/domingos').then(data => { setDomingos(Array.isArray(data) ? data : []); setCarregando(false) })
  }, [])

  const handleCriar = async () => {
    setCriando(true)
    const data = format(new Date(), 'yyyy-MM-dd')
    const dom = await apiPost('/domingos', { data, descricao: `Culto ${formatData(data)}` })
    ir('editar-domingo', { domingoId: dom.id })
    setCriando(false)
  }

  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

  return (
    <>
      <TopBar titulo="Cantina do Dia" />
      <div style={{ padding: '16px' }}>
        <BtnPrimario onClick={handleCriar} disabled={criando} style={{ marginBottom: '16px' }}>
          {criando ? 'Criando...' : '+ Novo Domingo'}
        </BtnPrimario>
        <SectionTitle>{domingos.length} domingos cadastrados</SectionTitle>
        {carregando && <div style={{ textAlign: 'center', padding: '20px', color: '#9E9E9E' }}>Carregando...</div>}
        {domingos.map(dom => {
          const [y, m, d] = dom.data.split('-')
          const lucro = dom.receitaEsperada && dom.custoTotal ? dom.receitaEsperada - dom.custoTotal : null
          return (
            <div key={dom.id} onClick={() => ir('editar-domingo', { domingoId: dom.id })}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', borderRadius: '12px', padding: '12px', marginBottom: '8px', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ background: '#E8F5E9', borderRadius: '10px', padding: '8px 12px', textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#2E7D32', lineHeight: 1 }}>{d}</div>
                <div style={{ fontSize: '11px', color: '#2E7D32', textTransform: 'uppercase' }}>{meses[parseInt(m)-1]}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{dom.descricao || `Domingo ${formatData(dom.data)}`}</div>
                <div style={{ fontSize: '12px', color: '#9E9E9E', marginTop: '2px' }}>
                  {dom._count?.cantinaItens || 0} produtos
                  {dom.custoTotal ? ` · Custo: ${formatMoeda(dom.custoTotal)}` : ''}
                  {lucro !== null ? ` · Lucro est.: ` : ''}
                  {lucro !== null && <span style={{ color: lucro >= 0 ? '#2E7D32' : '#D32F2F', fontWeight: 600 }}>{formatMoeda(lucro)}</span>}
                </div>
              </div>
              <span style={{ color: '#9E9E9E', fontSize: '20px' }}>›</span>
            </div>
          )
        })}
        {!carregando && domingos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9E9E9E', fontSize: '14px' }}>Nenhum domingo cadastrado ainda</div>
        )}
      </div>
    </>
  )
}

export function EditarDomingo() {
  const { params, mostrarToast, ir } = useStore()
  const { domingoId } = params
  const [domingo, setDomingo] = useState(null)
  const [produtos, setProdutos] = useState([])
  const [precos, setPrecos] = useState({})
  const [quantidades, setQuantidades] = useState({}) // quantidade produzida por produto
  const [selecionados, setSelecionados] = useState(new Set())
  const [custoTotal, setCustoTotal] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [aba, setAba] = useState('produtos') // 'produtos' | 'custos'

  useEffect(() => {
    async function carregar() {
      const [dom, prods] = await Promise.all([apiGet(`/domingos/${domingoId}`), apiGet('/produtos')])
      setDomingo(dom)
      setProdutos(Array.isArray(prods) ? prods : [])
      if (dom.cantinaItens?.length > 0) {
        const map = {}; const mapQ = {}; const sel = new Set()
        dom.cantinaItens.forEach(i => { map[i.produtoId] = i.preco; mapQ[i.produtoId] = i.quantidade || ''; sel.add(i.produtoId) })
        setPrecos(map); setQuantidades(mapQ); setSelecionados(sel)
      }
      if (dom.custoTotal) setCustoTotal(dom.custoTotal)
      setCarregando(false)
    }
    carregar()
  }, [domingoId])

  const handleCopiar = async () => {
    const itens = await apiGet(`/domingos/${domingoId}/copiar`)
    if (!Array.isArray(itens) || itens.length === 0) { mostrarToast('Nenhum domingo anterior!', 'erro'); return }
    const map = {}; const sel = new Set()
    itens.forEach(i => { map[i.produtoId] = i.preco; sel.add(i.produtoId) })
    setPrecos(map); setSelecionados(sel)
    mostrarToast('📋 Preços copiados!')
  }

  const toggleProduto = (id) => {
    setSelecionados(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  // Cálculos
  const itensSelecionados = produtos.filter(p => selecionados.has(p.id))
  const receitaEsperada = itensSelecionados.reduce((s, p) => {
    const qtd = parseFloat(quantidades[p.id] || 0)
    const preco = parseFloat(precos[p.id] || 0)
    return s + qtd * preco
  }, 0)
  const custo = parseFloat(custoTotal || 0)
  const lucroEstimado = receitaEsperada - custo
  const margem = receitaEsperada > 0 ? Math.round((lucroEstimado / receitaEsperada) * 100) : 0

  const handleSalvar = async () => {
    setSalvando(true)
    const itens = [...selecionados].map(produtoId => ({
      produtoId, preco: parseFloat(precos[produtoId] || 0), quantidade: parseFloat(quantidades[produtoId] || 0)
    })).filter(i => i.preco > 0)
    await apiPut(`/domingos/${domingoId}/itens`, { itens, custoTotal: custo, receitaEsperada })
    mostrarToast('✅ Cantina salva!')
    ir('domingos')
    setSalvando(false)
  }

  if (carregando) return (<><TopBar titulo="Carregando..." /><div style={{ padding: '32px', textAlign: 'center', color: '#9E9E9E' }}>Carregando...</div></>)

  return (
    <>
      <TopBar titulo={domingo?.descricao || 'Domingo'} />
      <div style={{ padding: '16px', paddingBottom: '24px' }}>

        {/* Abas */}
        <div style={{ display: 'flex', background: '#f5f5f5', borderRadius: '10px', padding: '4px', marginBottom: '16px' }}>
          {[['produtos','🛒 Produtos'],['custos','💰 Custos']].map(([key, label]) => (
            <button key={key} onClick={() => setAba(key)} style={{
              flex: 1, padding: '9px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: 600, fontSize: '13px',
              background: aba === key ? 'white' : 'transparent',
              color: aba === key ? '#2E7D32' : '#9E9E9E',
              boxShadow: aba === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
            }}>{label}</button>
          ))}
        </div>

        {aba === 'produtos' && (
          <>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <BtnOutline onClick={handleCopiar} style={{ flex: 1, padding: '10px 12px', fontSize: '13px' }}>📋 Copiar anterior</BtnOutline>
            </div>
            <SectionTitle>Produtos do dia</SectionTitle>
            <div style={{ background: 'white', borderRadius: '12px', padding: '0 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '14px' }}>
              {produtos.length === 0 && (
                <div style={{ padding: '24px 0', textAlign: 'center', color: '#9E9E9E', fontSize: '14px' }}>
                  <span onClick={() => ir('novo-produto')} style={{ color: '#2E7D32', cursor: 'pointer', fontWeight: 600 }}>+ Cadastrar produtos</span>
                </div>
              )}
              {produtos.map((prod, idx) => {
                const ativo = selecionados.has(prod.id)
                return (
                  <div key={prod.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 0' }}>
                      <button onClick={() => toggleProduto(prod.id)} style={{
                        width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0,
                        background: ativo ? '#2E7D32' : 'transparent', border: `2px solid ${ativo ? '#2E7D32' : '#ccc'}`,
                        cursor: 'pointer', color: 'white', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>{ativo ? '✓' : ''}</button>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: ativo ? '#1A1A1A' : '#9E9E9E' }}>{prod.nome}</div>
                        <div style={{ fontSize: '11px', color: '#9E9E9E' }}>{prod.categoria}</div>
                      </div>
                      {ativo && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '11px', color: '#9E9E9E' }}>Qtd</span>
                              <input type="number" min="0" value={quantidades[prod.id] || ''} onChange={e => setQuantidades(prev => ({ ...prev, [prod.id]: e.target.value }))}
                                placeholder="0" style={{ width: '55px', padding: '5px 7px', border: '1.5px solid #ccc', borderRadius: '7px', fontSize: '13px', textAlign: 'right', outline: 'none', fontFamily: 'inherit' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '11px', color: '#9E9E9E' }}>R$</span>
                              <input type="number" step="0.50" min="0" value={precos[prod.id] || ''} onChange={e => setPrecos(prev => ({ ...prev, [prod.id]: e.target.value }))}
                                placeholder="0,00" style={{ width: '65px', padding: '5px 7px', border: '1.5px solid #66BB6A', borderRadius: '7px', fontSize: '13px', fontWeight: 600, color: '#2E7D32', textAlign: 'right', outline: 'none', fontFamily: 'inherit' }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {idx < produtos.length - 1 && <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)' }} />}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {aba === 'custos' && (
          <>
            <SectionTitle>Custo de produção</SectionTitle>
            <div style={{ background: 'white', borderRadius: '12px', padding: '14px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '6px' }}>
                Custo total da cantina (ingredientes, embalagens, etc.)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9E9E9E' }}>R$</span>
                <input type="number" value={custoTotal} onChange={e => setCustoTotal(e.target.value)}
                  placeholder="0,00" style={{ width: '100%', padding: '12px 12px 12px 36px', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: '10px', fontSize: '18px', fontWeight: 700, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: '#D32F2F' }} />
              </div>
            </div>

            <SectionTitle>Resultado estimado</SectionTitle>
            <div style={{ background: 'white', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '14px' }}>
              {[
                { label: 'Receita esperada', value: formatMoeda(receitaEsperada), cor: '#2E7D32', desc: 'Qtd × preço de cada produto' },
                { label: 'Custo de produção', value: formatMoeda(custo), cor: '#D32F2F', desc: 'Total informado acima' },
                { label: 'Lucro estimado', value: formatMoeda(lucroEstimado), cor: lucroEstimado >= 0 ? '#2E7D32' : '#D32F2F', desc: `Margem de ${margem}%` },
              ].map((item, idx) => (
                <div key={item.label}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>{item.label}</div>
                      <div style={{ fontSize: '11px', color: '#9E9E9E' }}>{item.desc}</div>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: item.cor }}>{item.value}</div>
                  </div>
                  {idx < 2 && <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)' }} />}
                </div>
              ))}
              {receitaEsperada === 0 && (
                <div style={{ fontSize: '12px', color: '#FBC02D', marginTop: '8px', background: '#FFF8E1', padding: '8px 10px', borderRadius: '8px' }}>
                  ⚠️ Defina as quantidades dos produtos na aba Produtos para calcular a receita
                </div>
              )}
            </div>
          </>
        )}

        <BtnPrimario onClick={handleSalvar} disabled={salvando || selecionados.size === 0}>
          {salvando ? 'Salvando...' : `Salvar Cantina (${selecionados.size} produtos)`}
        </BtnPrimario>
      </div>
    </>
  )
}
