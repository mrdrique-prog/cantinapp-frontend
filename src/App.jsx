h// src/App.jsx
import { useEffect, useState } from 'react'
import { useStore } from './store/useStore'
import { db, seedDemoData } from './db/database'
import { Toast } from './components/UI'
import { api } from './services/api'
import Login from './pages/Login'

import Dashboard from './pages/Dashboard'
import NovaVenda from './pages/NovaVenda'
import Domingos, { EditarDomingo } from './pages/Domingos'
import { Contas, ContaDetalhe, Pagamento } from './pages/Contas'
import { Cobranca, RelatoriosInner } from './pages/Cobranca'
import { Pessoas, NovaPessoa, Produtos, NovoProduto } from './pages/Pessoas'
import { Configuracoes } from './pages/Configuracoes'
import { format } from 'date-fns'

const TELAS = {
  'dashboard':      Dashboard,
  'nova-venda':     NovaVenda,
  'domingos':       Domingos,
  'editar-domingo': EditarDomingo,
  'contas':         Contas,
  'conta-detalhe':  ContaDetalhe,
  'pagamento':      Pagamento,
  'cobranca':       Cobranca,
  'relatorios':     RelatoriosWrapper,
  'pessoas':        Pessoas,
  'nova-pessoa':    NovaPessoa,
  'editar-pessoa':  NovaPessoa,
  'produtos':       Produtos,
  'novo-produto':   NovoProduto,
  'editar-produto': NovoProduto,
  'configuracoes':  Configuracoes,
}

function RelatoriosWrapper() {
  const [mes, setMes] = useState(format(new Date(), 'yyyy-MM'))
  return <RelatoriosInner mes={mes} setMes={setMes} />
}

export default function App() {
  const { tela } = useStore()
  const [usuario, setUsuario] = useState(null)
  const [modoBackend, setModoBackend] = useState(false)
  const [verificando, setVerificando] = useState(true)

  useEffect(() => {
    async function inicializar() {
      const backendOnline = await api.checkOnline()
      setModoBackend(backendOnline)

      if (backendOnline) {
        const token = localStorage.getItem('cantinapp_token')
        if (token) {
          try { setUsuario(await api.getMe()) } catch { api.setToken(null) }
        }
      } else {
             }
      setVerificando(false)
    }
    inicializar()
  }, [])

  if (verificando) return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #1B5E20 0%, #2E7D32 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '16px'
    }}>
      <div style={{ fontSize: '56px' }}>⛪</div>
      <div style={{ fontSize: '24px', fontWeight: 800, color: 'white' }}>CantinApp</div>
      <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>ADEMJI</div>
      <div style={{ marginTop: '16px', display: 'flex', gap: '6px' }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.5)',
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`
          }} />
        ))}
      </div>
      <style>{`@keyframes pulse { 0%,80%,100%{opacity:0.3} 40%{opacity:1} }`}</style>
    </div>
  )

  if (modoBackend && !usuario) return (<><Login onLogin={setUsuario} /><Toast /></>)

  const Tela = TELAS[tela] || Dashboard

  return (
    <div style={{
      maxWidth: '480px', margin: '0 auto',
      minHeight: '100vh', background: '#f0f4f0',
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"
    }}>
      {modoBackend && (
        <div style={{ background: '#2E7D32', color: 'rgba(255,255,255,0.9)', fontSize: '11px', textAlign: 'center', padding: '5px', fontWeight: 600 }}>
          🟢 CantinApp ADEMJI — {usuario?.nome}
        </div>
      )}
      {!modoBackend && (
        <div style={{ background: '#FFF8E1', color: '#F57F17', fontSize: '11px', textAlign: 'center', padding: '5px', fontWeight: 600 }}>
          📱 Modo offline — dados salvos localmente
        </div>
      )}
      <Tela />
      <Toast />
    </div>
  )
}
