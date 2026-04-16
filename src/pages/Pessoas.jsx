// src/pages/Pessoas.jsx
import { useState } from 'react'
import { useStore } from '../store/useStore'
import { usePessoas, salvarPessoa } from '../hooks/useData'
import { TopBar, Avatar, avatarCor, BtnPrimario, SectionTitle } from '../components/UI'

const API = 'http://localhost:3001/api'

function getToken() { return localStorage.getItem('cantinapp_token') }

async function apiPost(path, body) {
  const res = await fetch(API + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify(body)
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.erro || 'Erro')
  return data
}

async function apiPut(path, body) {
  const res = await fetch(API + path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify(body)
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.erro || 'Erro')
  return data
}

async function apiGet(path) {
  const res = await fetch(API + path, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.erro || 'Erro')
  return data
}

export function Pessoas() {
  const { ir } = useStore()
  const [pessoas, setPessoas] = useState(null)
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(false)

  // Carrega pessoas da API ou IndexedDB
  useState(() => {
    async function carregar() {
      setCarregando(true)
      try {
        if (getToken()) {
          const data = await apiGet('/pessoas')
          setPessoas(data)
        } else {
          const { db } = await import('../db/database')
          const data = await db.pessoas.where('ativo').equals(1).sortBy('nome')
          setPessoas(data)
        }
      } catch (e) {
        setPessoas([])
      }
      setCarregando(false)
    }
    carregar()
  }, [])

  const filtradas = (pessoas || []).filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <>
      <TopBar titulo="Pessoas" />
      <div style={{ padding: '16px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'white', borderRadius: '12px', padding: '10px 14px',
          marginBottom: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
        }}>
          <span>🔍</span>
          <input value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar pessoa..." style={{ border: 'none', outline: 'none', flex: 1, fontSize: '14px', fontFamily: 'inherit', background: 'transparent' }} />
        </div>

        <BtnPrimario onClick={() => ir('nova-pessoa')} style={{ marginBottom: '14px' }}>
          + Nova Pessoa
        </BtnPrimario>

        <SectionTitle>{filtradas.length} pessoas cadastradas</SectionTitle>

        {carregando && <div style={{ textAlign: 'center', padding: '20px', color: '#9E9E9E' }}>Carregando...</div>}

        <div style={{ background: 'white', borderRadius: '12px', padding: '0 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {filtradas.length === 0 && !carregando && (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#9E9E9E', fontSize: '14px' }}>
              Nenhuma pessoa cadastrada ainda
            </div>
          )}
          {filtradas.map((p, idx) => (
            <div key={p.id}>
              <div onClick={() => ir('editar-pessoa', { pessoaId: p.id })} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', cursor: 'pointer'
              }}>
                <Avatar nome={p.nome} cor={avatarCor(p.id)} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{p.nome}</div>
                  <div style={{ fontSize: '12px', color: '#9E9E9E' }}>{p.telefone || 'Sem telefone'}</div>
                </div>
                <span style={{ color: '#9E9E9E', fontSize: '20px' }}>›</span>
              </div>
              {idx < filtradas.length - 1 && <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)' }} />}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export function NovaPessoa() {
  const { mostrarToast, ir, params } = useStore()
  const [form, setForm] = useState({ nome: '', telefone: '', observacoes: '' })
  const [salvando, setSalvando] = useState(false)

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSalvar = async () => {
    if (!form.nome.trim()) { mostrarToast('Informe o nome!', 'erro'); return }
    setSalvando(true)
    try {
      if (getToken()) {
        await apiPost('/pessoas', form)
      } else {
        await salvarPessoa({ ...form, ativo: true })
      }
      mostrarToast('✅ Pessoa cadastrada!')
      ir('pessoas')
    } catch (e) {
      mostrarToast('Erro ao salvar: ' + e.message, 'erro')
    }
    setSalvando(false)
  }

  return (
    <>
      <TopBar titulo="Nova Pessoa" />
      <div style={{ padding: '16px' }}>
        {[
          { label: 'Nome completo *', key: 'nome', type: 'text', placeholder: 'Ex: Maria Rita' },
          { label: 'Telefone (WhatsApp)', key: 'telefone', type: 'tel', placeholder: '(11) 99999-1234' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>{f.label}</label>
            <input type={f.type} value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)}
              placeholder={f.placeholder} style={{
                width: '100%', padding: '12px 14px',
                border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: '10px',
                fontSize: '15px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
              }} />
          </div>
        ))}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Observações</label>
          <textarea value={form.observacoes || ''} onChange={e => set('observacoes', e.target.value)}
            placeholder="Ex: Prefere ser cobrado por mensagem..." rows={3}
            style={{
              width: '100%', padding: '12px 14px',
              border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: '10px',
              fontSize: '14px', outline: 'none', fontFamily: 'inherit',
              boxSizing: 'border-box', resize: 'none'
            }} />
        </div>
        <BtnPrimario onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Cadastrar Pessoa'}
        </BtnPrimario>
      </div>
    </>
  )
}

// ─── Produtos ─────────────────────────────────────────────────────────────────
import { useProdutos, salvarProduto } from '../hooks/useData'

export function Produtos() {
  const { ir } = useStore()
  const [produtos, setProdutos] = useState(null)
  const [carregando, setCarregando] = useState(false)

  useState(() => {
    async function carregar() {
      setCarregando(true)
      try {
        if (getToken()) {
          const data = await apiGet('/produtos')
          setProdutos(data)
        } else {
          const { db } = await import('../db/database')
          const data = await db.produtos.where('ativo').equals(1).sortBy('nome')
          setProdutos(data)
        }
      } catch { setProdutos([]) }
      setCarregando(false)
    }
    carregar()
  }, [])

  const categorias = [...new Set((produtos || []).map(p => p.categoria))].sort()

  return (
    <>
      <TopBar titulo="Produtos" />
      <div style={{ padding: '16px' }}>
        <BtnPrimario onClick={() => ir('novo-produto')} style={{ marginBottom: '14px' }}>
          + Novo Produto
        </BtnPrimario>

        {carregando && <div style={{ textAlign: 'center', padding: '20px', color: '#9E9E9E' }}>Carregando...</div>}

        {categorias.map(cat => (
          <div key={cat}>
            <SectionTitle>{cat}</SectionTitle>
            <div style={{ background: 'white', borderRadius: '12px', padding: '0 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '12px' }}>
              {(produtos || []).filter(p => p.categoria === cat).map((prod, idx, arr) => (
                <div key={prod.id}>
                  <div onClick={() => ir('editar-produto', { produtoId: prod.id })} style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', cursor: 'pointer'
                  }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🏷️</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 500 }}>{prod.nome}</div>
                      <div style={{ fontSize: '12px', color: prod.ativo ? '#2E7D32' : '#9E9E9E' }}>
                        {prod.ativo ? '● Ativo' : '○ Inativo'}
                      </div>
                    </div>
                    <span style={{ color: '#9E9E9E', fontSize: '20px' }}>›</span>
                  </div>
                  {idx < arr.length - 1 && <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)' }} />}
                </div>
              ))}
            </div>
          </div>
        ))}

        {!carregando && (produtos || []).length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#9E9E9E', fontSize: '14px' }}>
            Nenhum produto cadastrado ainda
          </div>
        )}
      </div>
    </>
  )
}

export function NovoProduto() {
  const { mostrarToast, ir } = useStore()
  const [form, setForm] = useState({ nome: '', categoria: 'Salgados', ativo: true })
  const [salvando, setSalvando] = useState(false)

  const categorias = ['Salgados', 'Bebidas', 'Doces', 'Lanches', 'Outros']
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSalvar = async () => {
    if (!form.nome.trim()) { mostrarToast('Informe o nome!', 'erro'); return }
    setSalvando(true)
    try {
      if (getToken()) {
        await apiPost('/produtos', form)
      } else {
        await salvarProduto(form)
      }
      mostrarToast('✅ Produto cadastrado!')
      ir('produtos')
    } catch (e) {
      mostrarToast('Erro ao salvar: ' + e.message, 'erro')
    }
    setSalvando(false)
  }

  return (
    <>
      <TopBar titulo="Novo Produto" />
      <div style={{ padding: '16px' }}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Nome do produto *</label>
          <input value={form.nome || ''} onChange={e => set('nome', e.target.value)}
            placeholder="Ex: Coxinha" style={{
              width: '100%', padding: '12px 14px', border: '1.5px solid rgba(0,0,0,0.12)',
              borderRadius: '10px', fontSize: '15px', outline: 'none',
              fontFamily: 'inherit', boxSizing: 'border-box'
            }} />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Categoria</label>
          <select value={form.categoria} onChange={e => set('categoria', e.target.value)} style={{
            width: '100%', padding: '12px 14px', border: '1.5px solid rgba(0,0,0,0.12)',
            borderRadius: '10px', fontSize: '15px', outline: 'none', fontFamily: 'inherit'
          }}>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <BtnPrimario onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Cadastrar Produto'}
        </BtnPrimario>
      </div>
    </>
  )
}
