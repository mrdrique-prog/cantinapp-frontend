// src/pages/Contas.jsx
import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { TopBar, Avatar, avatarCor, formatMoeda, formatData, BtnPrimario, SectionTitle } from '../components/UI'
import { SenhaModal } from '../components/SenhaModal'
import { getConfig } from './Configuracoes'

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

async function apiDelete(path) {
  const res = await fetch(API + path, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return res.json()
}

// ─── LISTA DE DEVEDORES ───────────────────────────────────────────────────────
export function Contas({ onBack }) {
  const { ir } = useStore()
  const [pessoas, setPessoas] = useState([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    apiGet('/relatorios/devedores').then(d => {
      setPessoas(Array.isArray(d) ? d : [])
      setCarregando(false)
    }).catch(() => setCarregando(false))
  }, [])

  const filtrados = pessoas.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <>
      <TopBar titulo="Contas em Aberto" onBack={onBack}
        direita={
          <span style={{ background: '#D32F2F', color: 'white', borderRadius: '20px', padding: '4px 10px', fontSize: '13px', fontWeight: 600 }}>
            {formatMoeda(pessoas.reduce((s, p) => s + p.saldo, 0))}
          </span>
        }
      />
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', borderRadius: '12px', padding: '10px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '16px' }}>
          <span>🔍</span>
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar pessoa..."
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: '14px', fontFamily: 'inherit' }}
          />
        </div>

        {carregando && <div style={{ textAlign: 'center', padding: '20px', color: '#9E9E9E' }}>Carregando...</div>}

        <SectionTitle>{filtrados.length} devedor{filtrados.length !== 1 ? 'es' : ''}</SectionTitle>

        {!carregando && filtrados.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9E9E9E' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>✅</div>
            <div style={{ fontSize: '16px', fontWeight: 500 }}>Nenhum devedor!</div>
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '12px', padding: '0 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {filtrados.map((p, idx) => (
            <div key={p.id}>
              <div
                onClick={() => ir('conta-detalhe', { pessoaId: p.id })}
                style={{ display: 'flex', alignItems: 'center', padding: '12px 0', cursor: 'pointer' }}
              >
                <Avatar nome={p.nome} cor={avatarCor(p.id)} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{p.nome}</div>
                  <div style={{ fontSize: '12px', color: '#9E9E9E', marginTop: '2px' }}>Toque para extrato completo</div>
                </div>
                <span style={{ background: '#FFEBEE', color: '#D32F2F', borderRadius: '20px', padding: '4px 10px', fontSize: '13px', fontWeight: 600 }}>
                  {formatMoeda(p.saldo)}
                </span>
              </div>
              {idx < filtrados.length - 1 && <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)' }} />}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// ─── EXTRATO DO DEVEDOR ───────────────────────────────────────────────────────
export function ContaDetalhe({ pessoaId, onBack }) {
  const { ir, usuario } = useStore()
  const [pessoa, setPessoa] = useState(null)
  const [extrato, setExtrato] = useState([])
  const [saldo, setSaldo] = useState(0)
  const [carregando, setCarregando] = useState(true)

  async function carregar() {
    setCarregando(true)
    try {
      const data = await apiGet(`/cobracas/${pessoaId}`)
      setPessoa(data.pessoa || null)
      const ex = Array.isArray(data.extrato) ? data.extrato : []
      setExtrato(ex)
      setSaldo(data.saldo || ex.reduce((s, i) => s + i.valor, 0))
    } catch (e) {
      console.error('Erro ao carregar extrato:', e)
    } finally {
      setCarregando(false)
    }
  }

  async function handleApagarVenda(vendaId) {
    if (!confirm('Apagar este lançamento?')) return
    try {
      await apiDelete(`/vendas/${vendaId}`)
      await carregar()
    } catch (e) {
      alert('Erro ao apagar: ' + e.message)
    }
  }

  useEffect(() => { carregar() }, [pessoaId])

  return (
    <>
      <TopBar titulo={pessoa?.nome || 'Carregando...'} onBack={onBack} />
      <div style={{ padding: '16px', paddingBottom: '24px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '16px' }}>
          <Avatar nome={pessoa?.nome || ''} cor={avatarCor(pessoaId)} size={52} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 600 }}>{pessoa?.nome}</div>
            <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>{pessoa?.telefone}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#9E9E9E' }}>Saldo</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: saldo > 0 ? '#D32F2F' : '#2E7D32' }}>
              {formatMoeda(saldo)}
            </div>
          </div>
        </div>

        {saldo > 0 && (
          <BtnPrimario onClick={() => ir('pagamento', { pessoaId, saldo })} style={{ marginBottom: '16px' }}>
            Registrar Pagamento
          </BtnPrimario>
        )}

        <SectionTitle>Extrato ({extrato.length} lancamentos)</SectionTitle>
        {carregando && <div style={{ textAlign: 'center', padding: '20px', color: '#9E9E9E' }}>Carregando...</div>}

        <div style={{ background: 'white', borderRadius: '12px', padding: '0 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {extrato.length === 0 && !carregando && (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#9E9E9E', fontSize: '14px' }}>
              Nenhum lançamento
            </div>
          )}
          {extrato.map((item, idx) => (
            <div key={idx}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 0' }}>
                <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: item.tipo === 'compra' ? '#D32F2F' : '#2E7D32', marginTop: '4px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#1A1A1A' }}>{item.desc}</div>
                  <div style={{ fontSize: '11px', color: '#9E9E9E', marginTop: '2px' }}>
                    {formatData(item.data)}{item.domingo ? ` · ${item.domingo}` : ''}
                  </div>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: item.valor < 0 ? '#D32F2F' : '#2E7D32' }}>
                  {item.valor < 0 ? '-' : '+'}{formatMoeda(Math.abs(item.valor))}
                </div>
                {item.tipo === 'compra' && (item.vendaId || item.id) && (
                  <button
                    onClick={() => handleApagarVenda(item.vendaId || item.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D32F2F', fontSize: '16px', padding: '0 2px', lineHeight: 1 }}
                  >
                    🗑️
                  </button>
                )}
              </div>
              {idx < extrato.length - 1 && <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)' }} />}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// ─── REGISTRAR PAGAMENTO ──────────────────────────────────────────────────────
export function Pagamento({ pessoaId, saldo: saldoInicial, onBack }) {
  const { ir } = useStore()
  const [valor, setValor] = useState('')
  const [obs, setObs] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function handleSalvar() {
    if (!valor || isNaN(parseFloat(valor))) return alert('Valor inválido')
    setSalvando(true)
    try {
      await apiPost('/pagamentos', { pessoaId, valor: parseFloat(valor), obs })
      ir('conta-detalhe', { pessoaId })
    } catch (e) {
      alert('Erro: ' + e.message)
      setSalvando(false)
    }
  }

  return (
    <>
      <TopBar titulo="Registrar Pagamento" onBack={onBack} />
      <div style={{ padding: '16px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', color: '#9E9E9E', marginBottom: '4px' }}>Saldo devedor</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#D32F2F' }}>{formatMoeda(saldoInicial)}</div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', color: '#9E9E9E', marginBottom: '8px' }}>Valor recebido (R$)</div>
          <input
            type="number"
            value={valor}
            onChange={e => setValor(e.target.value)}
            placeholder="0,00"
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: '24px', fontWeight: 600, color: '#1A1A1A', fontFamily: 'inherit' }}
          />
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', color: '#9E9E9E', marginBottom: '8px' }}>Observação (opcional)</div>
          <input
            value={obs}
            onChange={e => setObs(e.target.value)}
            placeholder="Ex: Pix, dinheiro..."
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: '14px', fontFamily: 'inherit' }}
          />
        </div>
        <BtnPrimario onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Confirmar Pagamento'}
        </BtnPrimario>
      </div>
    </>
  )
}
