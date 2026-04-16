// src/pages/Login.jsx
import { useState } from 'react'
import { api } from '../services/api'
import { useStore } from '../store/useStore'

const API = 'http://localhost:3001/api'

export default function Login({ onLogin }) {
  const { mostrarToast } = useStore()
  const [tela, setTela] = useState('login') // login | esqueci | codigo | nova
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [codigo, setCodigo] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [senhaVisivel, setSenhaVisivel] = useState(false)

  const handleLogin = async () => {
    if (!email || !senha) { mostrarToast('Preencha email e senha', 'erro'); return }
    setCarregando(true)
    try {
      const data = await api.login(email, senha)
      onLogin(data.usuario)
    } catch (err) {
      mostrarToast(err.message || 'Email ou senha incorretos', 'erro')
    }
    setCarregando(false)
  }

  const handleEsqueci = async () => {
    if (!email) { mostrarToast('Informe seu email', 'erro'); return }
    setCarregando(true)
    try {
      const res = await fetch(`${API}/auth/esqueci-senha`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.erro)
      mostrarToast('✅ Código enviado para seu email!')
      setTela('codigo')
    } catch (e) { mostrarToast(e.message, 'erro') }
    setCarregando(false)
  }

  const handleResetar = async () => {
    if (!codigo || !novaSenha) { mostrarToast('Preencha todos os campos', 'erro'); return }
    if (novaSenha !== confirmar) { mostrarToast('As senhas não coincidem', 'erro'); return }
    if (novaSenha.length < 6) { mostrarToast('Mínimo 6 caracteres', 'erro'); return }
    setCarregando(true)
    try {
      const res = await fetch(`${API}/auth/resetar-senha`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codigo, novaSenha })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.erro)
      mostrarToast('✅ Senha redefinida! Faça login.')
      setTela('login')
    } catch (e) { mostrarToast(e.message, 'erro') }
    setCarregando(false)
  }

  const inputStyle = {
    width: '100%', padding: '14px 16px',
    border: '1.5px solid rgba(255,255,255,0.3)',
    borderRadius: '12px', fontSize: '15px',
    outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.15)',
    color: 'white',
    '::placeholder': { color: 'rgba(255,255,255,0.6)' }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #1B5E20 0%, #2E7D32 40%, #388E3C 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden'
    }}>
      {/* Decoração de fundo */}
      <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
      <div style={{ position: 'absolute', bottom: '-100px', left: '-60px', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '40px', zIndex: 1 }}>
        <div style={{ fontSize: '56px', marginBottom: '12px' }}>⛪</div>
        <div style={{ fontSize: '28px', fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>CantinApp</div>
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', marginTop: '4px', fontWeight: 500 }}>ADEMJI</div>
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: '380px', zIndex: 1 }}>

        {tela === 'login' && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Email" onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{ ...inputStyle, marginBottom: '12px' }} />
              <div style={{ position: 'relative' }}>
                <input type={senhaVisivel ? 'text' : 'password'} value={senha} onChange={e => setSenha(e.target.value)}
                  placeholder="Senha" onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  style={{ ...inputStyle, paddingRight: '48px' }} />
                <button onClick={() => setSenhaVisivel(!senhaVisivel)} style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '18px'
                }}>{senhaVisivel ? '🙈' : '👁'}</button>
              </div>
            </div>

            <button onClick={handleLogin} disabled={carregando} style={{
              width: '100%', background: 'white', color: '#2E7D32',
              border: 'none', borderRadius: '12px', padding: '15px',
              fontSize: '16px', fontWeight: 700, cursor: carregando ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', marginBottom: '16px', opacity: carregando ? 0.8 : 1,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}>
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>

            <button onClick={() => setTela('esqueci')} style={{
              width: '100%', background: 'none', border: '1.5px solid rgba(255,255,255,0.4)',
              borderRadius: '12px', padding: '13px', fontSize: '14px',
              color: 'rgba(255,255,255,0.9)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500
            }}>
              Esqueci minha senha
            </button>
          </>
        )}

        {tela === 'esqueci' && (
          <>
            <div style={{ color: 'white', marginBottom: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔐</div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>Recuperar senha</div>
              <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '4px' }}>Enviaremos um código para seu email</div>
            </div>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Seu email" style={{ ...inputStyle, marginBottom: '12px' }} />
            <button onClick={handleEsqueci} disabled={carregando} style={{
              width: '100%', background: 'white', color: '#2E7D32', border: 'none',
              borderRadius: '12px', padding: '15px', fontSize: '15px', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', marginBottom: '12px'
            }}>{carregando ? 'Enviando...' : 'Enviar código'}</button>
            <button onClick={() => setTela('login')} style={{
              width: '100%', background: 'none', border: '1.5px solid rgba(255,255,255,0.4)',
              borderRadius: '12px', padding: '12px', fontSize: '14px',
              color: 'rgba(255,255,255,0.9)', cursor: 'pointer', fontFamily: 'inherit'
            }}>← Voltar</button>
          </>
        )}

        {tela === 'codigo' && (
          <>
            <div style={{ color: 'white', marginBottom: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📧</div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>Verifique seu email</div>
              <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '4px' }}>Digite o código de 6 dígitos enviado para {email}</div>
            </div>
            <input value={codigo} onChange={e => setCodigo(e.target.value.toUpperCase())}
              placeholder="Código (ex: A1B2C3)" maxLength={6}
              style={{ ...inputStyle, textAlign: 'center', fontSize: '22px', fontWeight: 700, letterSpacing: '6px', marginBottom: '12px' }} />
            <input type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)}
              placeholder="Nova senha (mín. 6 caracteres)" style={{ ...inputStyle, marginBottom: '12px' }} />
            <input type="password" value={confirmar} onChange={e => setConfirmar(e.target.value)}
              placeholder="Confirmar nova senha" style={{ ...inputStyle, marginBottom: '12px' }} />
            <button onClick={handleResetar} disabled={carregando} style={{
              width: '100%', background: 'white', color: '#2E7D32', border: 'none',
              borderRadius: '12px', padding: '15px', fontSize: '15px', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', marginBottom: '12px'
            }}>{carregando ? 'Salvando...' : 'Redefinir senha'}</button>
            <button onClick={() => setTela('login')} style={{
              width: '100%', background: 'none', border: '1.5px solid rgba(255,255,255,0.4)',
              borderRadius: '12px', padding: '12px', fontSize: '14px',
              color: 'rgba(255,255,255,0.9)', cursor: 'pointer', fontFamily: 'inherit'
            }}>← Voltar ao login</button>
          </>
        )}
      </div>

      <div style={{ position: 'absolute', bottom: '24px', color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
        CantinApp ADEMJI v2.0
      </div>
    </div>
  )
}
