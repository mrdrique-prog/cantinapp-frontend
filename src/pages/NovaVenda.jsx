// src/pages/NovaVenda.jsx
import { useState, useEffect, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { TopBar, Avatar, avatarCor, formatMoeda, BtnPrimario, SectionTitle } from '../components/UI'

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api'
function getToken() { return localStorage.getItem('cantinapp_token') }
async function apiGet(path) {
  const res = await fetch(API + path, { headers: { 'Authorization': `Bearer ${getToken()}` } })
  return res.json()
}
async function apiPost(path, body) {
  const res = await fetch(API + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify(body)
  })
  return res.json()
}

// ─── Step 1: Selecionar Pessoa ───────────────────────────────────────────────
function SelecionarPessoa({ onSelect }) {
  const { ir } = useStore()
  const [pessoas, setPessoas] = useState([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    apiGet('/pessoas').then(data => { setPessoas(Array.isArray(data) ? data : []); setCarregando(false) })
  }, [])

  const filtradas = pessoas.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()))

  return (
    <>
      <TopBar titulo="Nova Venda — Selecionar Pessoa" />
      <div style={{ padding: '16px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'white', borderRadius: '12px', padding: '10px 14px',
          marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
        }}>
          <span>🔍</span>
          <input value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar pessoa..." style={{ border: 'none', outline: 'none', flex: 1, fontSize: '14px', fontFamily: 'inherit', background: 'transparent' }} />
        </div>

        <SectionTitle>{filtradas.length} pessoas</SectionTitle>

        {carregando && <div style={{ textAlign: 'center', padding: '20px', color: '#9E9E9E' }}>Carregando...</div>}

        <div style={{ background: 'white', borderRadius: '12px', padding: '0 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {filtradas.map((p, idx) => (
            <div key={p.id}>
              <div onClick={() => onSelect(p)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', cursor: 'pointer' }}>
                <Avatar nome={p.nome} cor={avatarCor(p.id)} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{p.nome}</div>
                  <div style={{ fontSize: '12px', color: p.saldo > 0 ? '#D32F2F' : '#4CAF50', marginTop: '1px' }}>
                    {p.saldo > 0 ? `Deve: ${formatMoeda(p.saldo)}` : 'Sem dívidas'}
                  </div>
                </div>
                <span style={{ color: '#9E9E9E', fontSize: '18px' }}>›</span>
              </div>
              {idx < filtradas.length - 1 && <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)' }} />}
            </div>
          ))}
          {!carregando && filtradas.length === 0 && (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#9E9E9E', fontSize: '14px' }}>Nenhuma pessoa encontrada</div>
          )}
        </div>

        <button onClick={() => ir('nova-pessoa')} style={{
          width: '100%', marginTop: '12px', background: 'none',
          border: '2px dashed #66BB6A', borderRadius: '12px', padding: '14px',
          color: '#2E7D32', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
        }}>+ Cadastrar nova pessoa</button>
      </div>
    </>
  )
}

// ─── Step 2: Itens da Venda ───────────────────────────────────────────────────
function ItensVenda({ pessoa }) {
  const { mostrarToast, ir } = useStore()
  const [domingos, setDomingos] = useState([])
  const [itens, setItens] = useState([])
  const [qtds, setQtds] = useState({})
  const [modalVenda, setModalVenda] = useState('fiado') // 'fiado' ou 'pago'
  const [salvando, setSalvando] = useState(false)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function carregar() {
      const doms = await apiGet('/domingos')
      if (Array.isArray(doms) && doms.length > 0) {
        setDomingos(doms)
        const det = await apiGet(`/domingos/${doms[0].id}`)
        setItens(det.cantinaItens || [])
      }
      setCarregando(false)
    }
    carregar()
  }, [])

  const domingoHoje = domingos[0]
  const total = useMemo(() => itens.reduce((s, item) => s + (qtds[item.id] || 0) * item.preco, 0), [itens, qtds])
  const mudarQtd = (itemId, delta) => setQtds(prev => ({ ...prev, [itemId]: Math.max(0, (prev[itemId] || 0) + delta) }))

  const handleSalvar = async () => {
    const itensSelecionados = itens.filter(i => (qtds[i.id] || 0) > 0)
    if (itensSelecionados.length === 0) { mostrarToast('Selecione pelo menos um item!', 'erro'); return }
    setSalvando(true)
    try {
      // Salvar venda
      await apiPost('/vendas', {
        pessoaId: pessoa.id,
        domingoId: domingoHoje.id,
        modalVenda,
        itens: itensSelecionados.map(i => ({ produtoId: i.produtoId, preco: i.preco, quantidade: qtds[i.id] }))
      })
      // Se pagou na hora, registrar pagamento automaticamente
      if (modalVenda === 'pago') {
        await apiPost('/pagamentos', { pessoaId: pessoa.id, valor: total, forma: 'Dinheiro', observacao: 'Pago na hora' })
      }
      mostrarToast(`✅ Venda ${modalVenda === 'pago' ? 'paga' : 'fiada'} de ${formatMoeda(total)} registrada!`)
      ir('dashboard')
    } catch (e) {
      mostrarToast('Erro ao salvar venda', 'erro')
    }
    setSalvando(false)
  }

  if (carregando) return (<><TopBar titulo={pessoa.nome} /><div style={{ padding: '32px 16px', textAlign: 'center', color: '#666' }}>Carregando cantina...</div></>)

  if (!domingoHoje || itens.length === 0) return (
    <>
      <TopBar titulo={pessoa.nome} />
      <div style={{ padding: '32px 16px', textAlign: 'center', color: '#666' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
        <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Nenhuma cantina cadastrada</div>
        <BtnPrimario onClick={() => ir('domingos')}>Ir para Cantina do Dia</BtnPrimario>
      </div>
    </>
  )

  return (
    <>
      <TopBar titulo={pessoa.nome} acoes={
        <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '20px', padding: '3px 10px', fontSize: '12px', fontWeight: 600 }}>
          {domingoHoje?.descricao || 'Domingo'}
        </span>
      } />
      <div style={{ padding: '16px', paddingBottom: '110px' }}>

        {/* Opção Fiado / Pago */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '12px 14px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '12px', color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
            Forma de pagamento
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setModalVenda('fiado')} style={{
              flex: 1, padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '14px',
              background: modalVenda === 'fiado' ? '#FFEBEE' : '#f5f5f5',
              color: modalVenda === 'fiado' ? '#D32F2F' : '#666',
              outline: modalVenda === 'fiado' ? '2px solid #D32F2F' : 'none'
            }}>📋 Fiado</button>
            <button onClick={() => setModalVenda('pago')} style={{
              flex: 1, padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '14px',
              background: modalVenda === 'pago' ? '#E8F5E9' : '#f5f5f5',
              color: modalVenda === 'pago' ? '#2E7D32' : '#666',
              outline: modalVenda === 'pago' ? '2px solid #2E7D32' : 'none'
            }}>✅ Pago agora</button>
          </div>
        </div>

        {/* Itens */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '0 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {itens.map((item, idx) => (
            <div key={item.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 0' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 500 }}>{item.produto?.nome}</div>
                  <div style={{ fontSize: '12px', color: '#9E9E9E', marginTop: '2px' }}>{formatMoeda(item.preco)} / un</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button onClick={() => mudarQtd(item.id, -1)} style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid #2E7D32', background: 'none', cursor: 'pointer', fontSize: '20px', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                  <span style={{ width: '28px', textAlign: 'center', fontSize: '16px', fontWeight: 700 }}>{qtds[item.id] || 0}</span>
                  <button onClick={() => mudarQtd(item.id, 1)} style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid #2E7D32', background: '#2E7D32', cursor: 'pointer', fontSize: '20px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>
              </div>
              {idx < itens.length - 1 && <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)' }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Barra inferior */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'white', borderTop: '1px solid rgba(0,0,0,0.1)',
        padding: '12px 16px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: '12px',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.08)'
      }}>
        <div>
          <div style={{ fontSize: '11px', color: '#9E9E9E' }}>
            {modalVenda === 'fiado' ? '📋 Fiado' : '✅ Pago agora'}
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: modalVenda === 'fiado' ? '#D32F2F' : '#2E7D32' }}>
            {formatMoeda(total)}
          </div>
        </div>
        <BtnPrimario onClick={handleSalvar} disabled={salvando || total === 0}
          style={{ width: 'auto', padding: '14px 28px', fontSize: '15px' }}>
          {salvando ? 'Salvando...' : 'Salvar Venda'}
        </BtnPrimario>
      </div>
    </>
  )
}

export default function NovaVenda() {
  const [pessoa, setPessoa] = useState(null)
  if (!pessoa) return <SelecionarPessoa onSelect={setPessoa} />
  return <ItensVenda pessoa={pessoa} />
}
