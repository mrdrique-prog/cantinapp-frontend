// src/components/SenhaModal.jsx
import { useState } from 'react'

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api'
function getToken() { return localStorage.getItem('cantinapp_token') }

export function SenhaModal({ titulo, descricao, onConfirmar, onCancelar }) {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [visivel, setVisivel] = useState(false)

  const handleConfirmar = async () => {
    if (!senha) { setErro('Digite sua senha'); return }
    setCarregando(true)
    setErro('')
    try {
      const res = await fetch(`${API}/auth/verificar-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ senha })
      })
      if (!res.ok) { setErro('Senha incorreta'); setCarregando(false); return }
      onConfirmar()
    } catch { setErro('Erro ao verificar senha') }
    setCarregando(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
    }}>
      <div style={{ background: 'white', borderRadius: '20px', padding: '28px 24px', width: '100%', maxWidth: '360px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔐</div>
          <div style={{ fontSize: '17px', fontWeight: 700, color: '#1A1A1A' }}>{titulo}</div>
          {descricao && <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{descricao}</div>}
        </div>
        <div style={{ position: 'relative', marginBottom: '8px' }}>
          <input
            type={visivel ? 'text' : 'password'}
            value={senha}
            onChange={e => { setSenha(e.target.value); setErro('') }}
            onKeyDown={e => e.key === 'Enter' && handleConfirmar()}
            placeholder="Digite sua senha"
            autoFocus
            style={{
              width: '100%', padding: '13px 44px 13px 14px',
              border: `1.5px solid ${erro ? '#D32F2F' : 'rgba(0,0,0,0.15)'}`,
              borderRadius: '10px', fontSize: '15px', outline: 'none',
              fontFamily: 'inherit', boxSizing: 'border-box'
            }}
          />
          <button onClick={() => setVisivel(!visivel)} style={{
            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#9E9E9E'
          }}>{visivel ? '🙈' : '👁'}</button>
        </div>
        {erro && <div style={{ color: '#D32F2F', fontSize: '12px', marginBottom: '12px', padding: '0 2px' }}>⚠️ {erro}</di
