// src/components/UI.jsx
import { useStore } from '../store/useStore'

export function TopBar({ titulo, acoes }) {
  const { voltar } = useStore()
  return (
    <div style={{
      background: '#2E7D32', color: 'white',
      padding: '16px', display: 'flex', alignItems: 'center', gap: '12px',
      position: 'sticky', top: 0, zIndex: 10
    }}>
      <button onClick={voltar} style={{
        background: 'none', border: 'none', color: 'white',
        fontSize: '22px', cursor: 'pointer', padding: '0 4px', lineHeight: 1
      }}>←</button>
      <h1 style={{ flex: 1, fontSize: '17px', fontWeight: 500, margin: 0 }}>{titulo}</h1>
      {acoes}
    </div>
  )
}

export function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: 'white', borderRadius: '12px',
      padding: '14px', marginBottom: '10px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      cursor: onClick ? 'pointer' : 'default',
      ...style
    }}>
      {children}
    </div>
  )
}

export function BtnPrimario({ children, onClick, disabled, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', background: disabled ? '#9E9E9E' : '#2E7D32',
      color: 'white', border: 'none', borderRadius: '12px',
      padding: '14px', fontSize: '16px', fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'inherit', ...style
    }}>
      {children}
    </button>
  )
}

export function BtnOutline({ children, onClick, style = {} }) {
  return (
    <button onClick={onClick} style={{
      background: 'white', color: '#2E7D32',
      border: '2px solid #2E7D32', borderRadius: '12px',
      padding: '12px', fontSize: '14px', fontWeight: 600,
      cursor: 'pointer', fontFamily: 'inherit', ...style
    }}>
      {children}
    </button>
  )
}

export function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      {label && <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>{label}</label>}
      <input {...props} style={{
        width: '100%', padding: '12px 14px',
        border: '1.5px solid rgba(0,0,0,0.12)',
        borderRadius: '8px', fontSize: '15px',
        outline: 'none', fontFamily: 'inherit',
        boxSizing: 'border-box', ...props.style
      }} />
    </div>
  )
}

export function Badge({ children, cor = 'verde' }) {
  const cores = {
    verde:    { bg: '#E8F5E9', text: '#2E7D32' },
    vermelho: { bg: '#FFEBEE', text: '#D32F2F' },
    azul:     { bg: '#E3F2FD', text: '#1565C0' },
    amarelo:  { bg: '#FFF8E1', text: '#F57F17' },
  }
  const c = cores[cor] || cores.verde
  return (
    <span style={{
      background: c.bg, color: c.text,
      borderRadius: '20px', padding: '4px 10px',
      fontSize: '12px', fontWeight: 600
    }}>{children}</span>
  )
}

export function Avatar({ nome, cor = 'verde', size = 40 }) {
  const iniciais = nome?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?'
  const cores = {
    verde:    { bg: '#E8F5E9', text: '#2E7D32' },
    vermelho: { bg: '#FFEBEE', text: '#D32F2F' },
    azul:     { bg: '#E3F2FD', text: '#1565C0' },
    roxo:     { bg: '#F3E5F5', text: '#7B1FA2' },
    laranja:  { bg: '#FFF3E0', text: '#E65100' },
  }
  const c = cores[cor] || cores.verde
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: c.bg, color: c.text,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 600, fontSize: size * 0.35, flexShrink: 0
    }}>{iniciais}</div>
  )
}

const CORES_AVATAR = ['verde', 'azul', 'vermelho', 'roxo', 'laranja']
export function avatarCor(id) { return CORES_AVATAR[(id || 0) % CORES_AVATAR.length] }

export function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: '12px', fontWeight: 700, color: '#9E9E9E',
      textTransform: 'uppercase', letterSpacing: '0.6px',
      marginBottom: '8px', marginTop: '4px'
    }}>{children}</div>
  )
}

export function Divider() {
  return <div style={{ height: '1px', background: 'rgba(0,0,0,0.07)', margin: '0 -14px' }} />
}

export function Toast() {
  const { toast } = useStore()
  if (!toast) return null
  const bg = toast.tipo === 'erro' ? '#D32F2F' : '#323232'
  return (
    <div style={{
      position: 'fixed', bottom: '24px', left: '50%',
      transform: 'translateX(-50%)',
      background: bg, color: 'white',
      padding: '12px 20px', borderRadius: '12px',
      fontSize: '14px', zIndex: 100,
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      whiteSpace: 'nowrap', animation: 'fadeIn 0.2s ease'
    }}>
      {toast.msg}
    </div>
  )
}

export function formatMoeda(valor) {
  return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatData(data) {
  if (!data) return ''
  const [y, m, d] = data.split('-')
  return `${d}/${m}/${y}`
}

export function formatMes(mesStr) {
  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const [y, m] = mesStr.split('-')
  return `${meses[parseInt(m) - 1]} ${y}`
}
