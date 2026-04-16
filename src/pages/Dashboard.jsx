// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { Avatar, avatarCor, formatMoeda } from '../components/UI'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const API = 'http://localhost:3001/api'
function getToken() { return localStorage.getItem('cantinapp_token') }
async function apiGet(path) {
  try {
    const res = await fetch(API + path, { headers: { 'Authorization': `Bearer ${getToken()}` } })
    return res.json()
  } catch { return null }
}

export default function Dashboard() {
  const { ir } = useStore()
  const [devedores, setDevedores] = useState([])
  const [resumo, setResumo] = useState(null)

  useEffect(() => {
    const mes = format(new Date(), 'yyyy-MM')
    apiGet('/relatorios/devedores').then(data => setDevedores(Array.isArray(data) ? data : []))
    apiGet(`/relatorios/mensal?mes=${mes}`).then(data => setResumo(data))
  }, [])

  const totalAberto = devedores.reduce((s, p) => s + p.saldo, 0)

  const btns = [
    { label: 'Nova Venda',        icon: '🛒', bg: '#E8F5E9', tela: 'nova-venda' },
    { label: 'Cantina do Dia',    icon: '📋', bg: '#E3F2FD', tela: 'domingos' },
    { label: 'Contas em Aberto',  icon: '💳', bg: '#FFEBEE', tela: 'contas' },
    { label: 'Receber Pgto.',     icon: '💰', bg: '#E8F5E9', tela: 'pagamento' },
    { label: 'Cobrança WhatsApp', icon: '📱', bg: '#FFF8E1', tela: 'cobranca' },
    { label: 'Relatórios',        icon: '📊', bg: '#F3E5F5', tela: 'relatorios' },
    { label: 'Pessoas',           icon: '👥', bg: '#E0F2F1', tela: 'pessoas' },
    { label: 'Produtos',          icon: '🏷️', bg: '#FFF3E0', tela: 'produtos' },
    { label: 'Configurações',     icon: '⚙️', bg: '#F5F5F5', tela: 'configuracoes' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f0' }}>
      <div style={{ background: '#2E7D32', padding: '20px 16px 28px', color: 'white' }}>
        <div style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.5px' }}>⛪ CantinApp</div>
        <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '2px' }}>
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '14px' }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 12px' }}>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>Total em aberto</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#FFCDD2' }}>{formatMoeda(totalAberto)}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 12px' }}>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>Arrecadado (mês)</div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>{formatMoeda(resumo?.totalRecebido)}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '16px', marginTop: '-14px' }}>
        {btns.map(b => (
          <button key={b.tela} onClick={() => ir(b.tela)} style={{
            background: 'white', border: 'none', borderRadius: '14px', padding: '18px 12px',
            cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)', transition: 'transform 0.1s'
          }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: b.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>{b.icon}</div>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#1A1A1A', textAlign: 'center', lineHeight: 1.3 }}>{b.label}</span>
          </button>
        ))}
      </div>


    </div>
  )
}
