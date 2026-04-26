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

export function Contas() {
  const { ir } = useStore()
  const [devedores, setDevedores] = useState([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    apiGet('/relatorios/devedores')
      .then(data => {
        setDevedores(Array.isArray(data) ? data : [])
        setCarregando(false)
      })
      .catch(() => setCarregando(false))
  }, [])

  const filtrados = devedores.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()))
  const total = filtrados.reduce((s, p) => s + p.saldo, 0)

  return (
    <>
      <TopBar titulo="Contas em Aberto" acoes={
        <span style={{ background: '#FFCDD2', color: '#D32F2F', borderRadius: '20px', padding: '3px 10px', fontSize: '12px', fontWeight: 700 }}>
          {formatMoeda(total)}
        </span>
      } />
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', borderRadius: '12px', padding: '10px 14px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <span>🔍</span>
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar pessoa..."
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: '14px', fontFamily: 'inherit', background: 'transparent' }}
          />
        </div>
        {carregando && <div style={{ textAlign: 'cent
