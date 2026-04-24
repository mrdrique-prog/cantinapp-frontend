// src/pages/Cobranca.jsx
import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { TopBar, Avatar, avatarCor, formatMoeda, SectionTitle, BtnPrimario } from '../components/UI'
import { format, subMonths } from 'date-fns'
import { getConfig } from './Configuracoes'

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api'
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

function formatMes(mesStr) {
  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const [y, m] = mesStr.split('-')
  return `${meses[parseInt(m) - 1]} ${y}`
}

function formatData(data) {
  if (!data) return ''
  const [y, m, d] = data.split('-')
  return `${d}/${m}`
}

export function Cobranca() {
  const { mostrarToast } = useStore()
  const mesAnterior = format(subMonths(new Date(), 1), 'yyyy-MM')
  const [mesRef, setMesRef] = useState(mesAnterior)
  const [devedores, setDevedores] = useState([])
  const [cobranças, setCobranças] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [pessPreview, setPessPreview] = useState(null)
  const [extratos, setExtratos] = useState({})
  const [modalPago, setModalPago] = useState(null) // { pessoa }
  const [nomePagador, setNomePagador] = useState('')
  const [comprovanteRecebido, setComprovanteRecebido] = useState({})
  const config = getConfig()

  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      const [dev, cob] = await Promise.all([
        apiGet('/relatorios/devedores'),
        apiGet(`/cobranças?mesRef=${mesRef}`)
      ])
      setDevedores(Array.isArray(dev) ? dev : [])
      setCobranças(Array.isArray(cob) ? cob : [])
      setCarregando(false)
    }
    carregar()
  }, [mesRef])

  // Carrega extrato de uma pessoa para o preview
  const carregarExtrato = async (pessoa) => {
    if (extratos[pessoa.id]) { setPessPreview(pessoa); return }
    const ext = await apiGet(`/pessoas/${pessoa.id}/extrato`)
    setExtratos(prev => ({ ...prev, [pessoa.id]: Array.isArray(ext) ? ext : [] }))
    setPessPreview(pessoa)
  }

  const jaCobramos = new Set(cobranças.map(c => c.pessoaId))

  const gerarMensagem = (pessoa) => {
  const ext = extratos[pessoa.id] || []
  const compras = ext.filter(e => e.tipo === 'compra')

  let linhasCompras = ''
  if (compras.length > 0) {
    linhasCompras = '\n📋 *Detalhamento:*\n'
    compras.forEach(c => {
      linhasCompras += `• ${formatData(c.data)} → ${c.desc}: *${formatMoeda(Math.abs(c.valor))}*\n`
    })
  }

  let pixInfo = ''
  if (config.pixChave) {
    pixInfo = `\n💳 *Para pagar via PIX:*\n🔑 Chave (${config.pixTipo}): *${config.pixChave}*\n👤 Nome: ${config.pixNome || config.igrejaNome}\n`
  }

  return `A paz do Senhor, *${pessoa.nome}*! 🙏\n\nPassando para informar que há um valor em aberto referente à cantina:${linhasCompras}\n💰 *Total em aberto: ${formatMoeda(pessoa.saldo)}*\n${pixInfo}\n⚠️ *Aviso de segurança:* Não enviamos cobranças nem solicitações de pagamento via PIX por mensagem. Em caso de dúvida, confirme pessoalmente com a Pastora Neide ou Henrique.\n\nObrigado pelo seu apoio à nossa cantina! 🙏\n— ${config.igrejaNome || 'Cantina ADEMJI'}`
}
  const abrirWhatsApp = async (pessoa) => {
    if (!extratos[pessoa.id]) {
      const ext = await apiGet(`/pessoas/${pessoa.id}/extrato`)
      setExtratos(prev => ({ ...prev, [pessoa.id]: Array.isArray(ext) ? ext : [] }))
    }
    await apiPost('/cobranças', { pessoaId: pessoa.id, mesRef, valor: pessoa.saldo })
    setCobranças(prev => [...prev, { pessoaId: pessoa.id }])
    setTimeout(() => {
      const msg = encodeURIComponent(gerarMensagem(pessoa))
      const tel = (pessoa.telefone || '').replace(/\D/g, '')
      window.open(`https://wa.me/55${tel}?text=${msg}`, '_blank')
    }, 100)
    mostrarToast(`📱 WhatsApp aberto para ${pessoa.nome}!`)
  }

  const handlePagoPessoalmente = async () => {
    if (!nomePagador.trim()) { mostrarToast('Informe o nome de quem recebeu!', 'erro'); return }
    await apiPost('/pagamentos', {
      pessoaId: modalPago.id,
      valor: modalPago.saldo,
      forma: 'Dinheiro',
      observacao: `Pago pessoalmente — recebido por: ${nomePagador}`
    })
    await apiPost('/cobranças', { pessoaId: modalPago.id, mesRef, valor: modalPago.saldo })
    setDevedores(prev => prev.filter(p => p.id !== modalPago.id))
    mostrarToast(`✅ Pagamento de ${formatMoeda(modalPago.saldo)} registrado!`)
    setModalPago(null)
    setNomePagador('')
  }

  const mesesOpts = [0,1,2,3,4].map(i => format(subMonths(new Date(), i), 'yyyy-MM'))

  return (
    <>
      <TopBar titulo="Cobrança via WhatsApp" />
      <div style={{ padding: '16px' }}>

        {/* Modal Pago Pessoalmente */}
        {modalPago && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '360px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>💵 Pago Pessoalmente</div>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>{modalPago.nome} — {formatMoeda(modalPago.saldo)}</div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '6px' }}>Nome de quem recebeu o pagamento</label>
              <input value={nomePagador} onChange={e => setNomePagador(e.target.value)}
                placeholder="Ex: João (Tesoureiro)"
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '14px' }} />

              {/* Comprovante transferência */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', padding: '10px 12px', background: '#f5f5f5', borderRadius: '10px' }}>
                <input type="checkbox" id="comprovante" checked={comprovanteRecebido[modalPago.id] || false}
                  onChange={e => setComprovanteRecebido(prev => ({ ...prev, [modalPago.id]: e.target.checked }))}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                <label htmlFor="comprovante" style={{ fontSize: '13px', color: '#333', cursor: 'pointer' }}>
                  📎 Comprovante de transferência recebido
                </label>
              </div>

              {config.tesourceiroTelefone && (
                <button onClick={() => {
                  const tel = config.tesourceiroTelefone.replace(/\D/g, '')
                  const msg = encodeURIComponent(`Olá! Sou ${modalPago.nome} e gostaria de enviar o comprovante de pagamento da cantina no valor de ${formatMoeda(modalPago.saldo)}.`)
                  window.open(`https://wa.me/55${tel}?text=${msg}`, '_blank')
                }} style={{ width: '100%', background: '#25D366', color: 'white', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: '10px' }}>
                  📱 Solicitar comprovante via WhatsApp
                </button>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => { setModalPago(null); setNomePagador('') }} style={{ flex: 1, background: '#f5f5f5', color: '#666', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                <button onClick={handlePagoPessoalmente} style={{ flex: 2, background: '#2E7D32', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Confirmar Pagamento</button>
              </div>
            </div>
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '12px', padding: '14px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Mês de referência</label>
          <select value={mesRef} onChange={e => setMesRef(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}>
            {mesesOpts.map(m => <option key={m} value={m}>{formatMes(m)}</option>)}
          </select>
        </div>

        {!config.pixChave && (
          <div style={{ background: '#FFF8E1', border: '1px solid #FBC02D', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#F57F17', marginBottom: '14px' }}>
            ⚠️ Configure a chave PIX em <strong>Configurações</strong> para incluir nas mensagens
          </div>
        )}

        {/* Preview da mensagem */}
        {pessPreview && extratos[pessPreview.id] && (
          <div style={{ background: '#E8F5E9', borderLeft: '3px solid #2E7D32', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', lineHeight: 1.7, marginBottom: '14px', color: '#1A1A1A', whiteSpace: 'pre-wrap' }}>
            {gerarMensagem(pessPreview)}
            <button onClick={() => setPessPreview(null)} style={{ display: 'block', marginTop: '8px', background: 'none', border: 'none', color: '#2E7D32', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, padding: 0 }}>Fechar ↑</button>
          </div>
        )}

        <SectionTitle>{devedores.length} devedores</SectionTitle>
        {carregando && <div style={{ textAlign: 'center', padding: '20px', color: '#9E9E9E' }}>Carregando...</div>}

        <div style={{ background: 'white', borderRadius: '12px', padding: '0 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '14px' }}>
          {!carregando && devedores.length === 0 && (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#9E9E9E', fontSize: '14px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
              Nenhum devedor!
            </div>
          )}
          {devedores.map((p, idx) => {
            const enviada = jaCobramos.has(p.id)
            return (
              <div key={p.id}>
                <div style={{ padding: '12px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <Avatar nome={p.nome} cor={avatarCor(p.id)} size={36} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{p.nome}</div>
                      <div style={{ fontSize: '12px', color: '#D32F2F', fontWeight: 500 }}>{formatMoeda(p.saldo)} em aberto</div>
                    </div>
                    {enviada && <span style={{ background: '#E8F5E9', color: '#2E7D32', borderRadius: '8px', padding: '4px 8px', fontSize: '11px', fontWeight: 600 }}>✓ Cobrado</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button onClick={() => carregarExtrato(p)} style={{ background: '#E8F5E9', color: '#2E7D32', border: 'none', borderRadius: '8px', padding: '7px 10px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>👁 Ver extrato</button>
                    <button onClick={() => abrirWhatsApp(p)} style={{ background: '#25D366', color: 'white', border: 'none', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>📱 WhatsApp</button>
                    <button onClick={() => { setModalPago(p); setNomePagador('') }} style={{ background: '#E3F2FD', color: '#1565C0', border: 'none', borderRadius: '8px', padding: '7px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>💵 Pago pessoalmente</button>
                  </div>
                </div>
                {idx < devedores.length - 1 && <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)' }} />}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

export function RelatoriosInner({ mes, setMes }) {
  const [resumo, setResumo] = useState(null)
  const [devedores, setDevedores] = useState([])

  useEffect(() => {
    apiGet(`/relatorios/mensal?mes=${mes}`).then(setResumo)
    apiGet('/relatorios/devedores').then(data => setDevedores(Array.isArray(data) ? data : []))
  }, [mes])

  const totalAberto = devedores.reduce((s, p) => s + p.saldo, 0)
  const adimplencia = resumo ? Math.round((resumo.totalRecebido / (resumo.totalVendido || 1)) * 100) : 0
  const mesesOpts = [0,1,2,3,4].map(i => format(subMonths(new Date(), i), 'yyyy-MM'))

  return (
    <>
      <TopBar titulo="Relatórios" />
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '16px', paddingBottom: '4px' }}>
          {mesesOpts.map(m => (
            <button key={m} onClick={() => setMes(m)} style={{
              flexShrink: 0, background: mes === m ? '#2E7D32' : '#E8F5E9', color: mes === m ? 'white' : '#2E7D32',
              border: 'none', borderRadius: '20px', padding: '7px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
            }}>{formatMes(m)}</button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
          {[
            { label: 'Total vendido', value: formatMoeda(resumo?.totalVendido), cor: '#2E7D32' },
            { label: 'Total recebido', value: formatMoeda(resumo?.totalRecebido), cor: '#1565C0' },
            { label: 'Em aberto', value: formatMoeda(totalAberto), cor: '#D32F2F' },
            { label: 'Vendas', value: resumo?.qtdVendas || 0, cor: '#1A1A1A' },
          ].map(m => (
            <div key={m.label} style={{ background: 'white', borderRadius: '12px', padding: '12px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '12px', color: '#9E9E9E', marginBottom: '4px' }}>{m.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: m.cor }}>{m.value}</div>
            </div>
          ))}
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '14px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
            <span style={{ color: '#9E9E9E', fontSize: '12px', textTransform: 'uppercase', fontWeight: 700 }}>Taxa de adimplência</span>
            <span style={{ fontWeight: 700, color: adimplencia >= 70 ? '#2E7D32' : '#D32F2F' }}>{adimplencia}%</span>
          </div>
          <div style={{ height: '10px', background: '#f0f0f0', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${adimplencia}%`, background: adimplencia >= 70 ? '#2E7D32' : '#D32F2F', borderRadius: '5px', transition: 'width 0.5s' }} />
          </div>
        </div>
        <SectionTitle>{devedores.length} devedores ativos</SectionTitle>
        <div style={{ background: 'white', borderRadius: '12px', padding: '0 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {devedores.length === 0 && <div style={{ padding: '20px 0', textAlign: 'center', color: '#9E9E9E', fontSize: '14px' }}>Nenhum devedor</div>}
          {devedores.slice(0, 5).map((p, idx) => (
            <div key={p.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0' }}>
                <Avatar nome={p.nome} cor={avatarCor(p.id)} size={32} />
                <div style={{ flex: 1, fontSize: '13px', fontWeight: 500 }}>{p.nome}</div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#D32F2F' }}>{formatMoeda(p.saldo)}</span>
              </div>
              {idx < Math.min(4, devedores.length - 1) && <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)' }} />}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
