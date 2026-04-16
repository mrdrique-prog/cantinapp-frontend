// src/pages/Configuracoes.jsx
import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { TopBar, BtnPrimario, SectionTitle } from '../components/UI'
import { SenhaModal } from '../components/SenhaModal'

const API = 'http://localhost:3001/api'
function getToken() { return localStorage.getItem('cantinapp_token') }

export function Configuracoes() {
  const { mostrarToast, ir } = useStore()
  const [config, setConfig] = useState({
    pixChave: '', pixTipo: 'telefone', pixNome: '',
    igrejaNome: 'ADEMJI', mensagemRodape: 'Obrigado pelo seu apoio! 🙏',
    tesourceiroNome: '', tesourceiroTelefone: '',
  })
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrarSenhaModal, setMostrarSenhaModal] = useState(false)
  const [acaoSenha, setAcaoSenha] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [aba, setAba] = useState('geral')

  useEffect(() => {
    const salvo = localStorage.getItem('cantinapp_config')
    if (salvo) setConfig(JSON.parse(salvo))
  }, [])

  const set = (k, v) => setConfig(prev => ({ ...prev, [k]: v }))

  const handleSalvarConfig = () => {
    localStorage.setItem('cantinapp_config', JSON.stringify(config))
    mostrarToast('✅ Configurações salvas!')
  }

  const handleTrocarSenha = () => {
    if (!senhaAtual || !novaSenha || !confirmar) { mostrarToast('Preencha todos os campos', 'erro'); return }
    if (novaSenha !== confirmar) { mostrarToast('As senhas não coincidem', 'erro'); return }
    if (novaSenha.length < 6) { mostrarToast('Mínimo 6 caracteres', 'erro'); return }
    setMostrarSenhaModal(true)
    setAcaoSenha('trocar-senha')
  }

  const executarTrocaSenha = async () => {
    setMostrarSenhaModal(false)
    setSalvando(true)
    try {
      const res = await fetch(`${API}/auth/senha`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ senhaAtual, novaSenha })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.erro)
      mostrarToast('✅ Senha alterada! Admin foi notificado.')
      setSenhaAtual(''); setNovaSenha(''); setConfirmar('')
    } catch (e) { mostrarToast(e.message, 'erro') }
    setSalvando(false)
  }

  const tiposPix = ['telefone', 'cpf', 'email', 'aleatoria']
  const abas = [['geral', '⚙️ Geral'], ['pix', '💳 PIX'], ['senha', '🔐 Senha']]

  return (
    <>
      {mostrarSenhaModal && (
        <SenhaModal
          titulo="Confirmar troca de senha"
          descricao="Digite sua senha atual para confirmar"
          onConfirmar={executarTrocaSenha}
          onCancelar={() => setMostrarSenhaModal(false)}
        />
      )}
      <TopBar titulo="Configurações" />
      <div style={{ padding: '16px', paddingBottom: '24px' }}>

        {/* Abas */}
        <div style={{ display: 'flex', background: '#f5f5f5', borderRadius: '10px', padding: '4px', marginBottom: '16px' }}>
          {abas.map(([key, label]) => (
            <button key={key} onClick={() => setAba(key)} style={{
              flex: 1, padding: '9px 4px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: 600, fontSize: '12px',
              background: aba === key ? 'white' : 'transparent',
              color: aba === key ? '#2E7D32' : '#9E9E9E',
              boxShadow: aba === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
            }}>{label}</button>
          ))}
        </div>

        {aba === 'geral' && (
          <>
            <SectionTitle>Dados da Igreja</SectionTitle>
            <div style={{ background: 'white', borderRadius: '12px', padding: '14px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              {[
                { label: 'Nome da Igreja', key: 'igrejaNome', placeholder: 'Ex: ADEMJI' },
                { label: 'Mensagem de rodapé (WhatsApp)', key: 'mensagemRodape', placeholder: 'Ex: Obrigado pelo apoio!' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>{f.label}</label>
                  <input value={config[f.key]} onChange={e => set(f.key, e.target.value)}
                    placeholder={f.placeholder} style={{ width: '100%', padding: '11px 14px', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>

            <SectionTitle>Tesoureiro</SectionTitle>
            <div style={{ background: 'white', borderRadius: '12px', padding: '14px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              {[
                { label: 'Nome do tesoureiro', key: 'tesourceiroNome', placeholder: 'Ex: João Silva' },
                { label: 'WhatsApp do tesoureiro', key: 'tesourceiroTelefone', placeholder: 'Ex: 11999991234' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>{f.label}</label>
                  <input value={config[f.key]} onChange={e => set(f.key, e.target.value)}
                    placeholder={f.placeholder} style={{ width: '100%', padding: '11px 14px', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>
            <BtnPrimario onClick={handleSalvarConfig}>Salvar Configurações</BtnPrimario>
          </>
        )}

        {aba === 'pix' && (
          <>
            <SectionTitle>Chave PIX</SectionTitle>
            <div style={{ background: 'white', borderRadius: '12px', padding: '14px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Tipo da chave</label>
                <select value={config.pixTipo} onChange={e => set('pixTipo', e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}>
                  {tiposPix.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              {[
                { label: 'Chave PIX', key: 'pixChave', placeholder: 'Ex: (11) 99999-1234' },
                { label: 'Nome do titular', key: 'pixNome', placeholder: 'Ex: Igreja ADEMJI' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>{f.label}</label>
                  <input value={config[f.key]} onChange={e => set(f.key, e.target.value)}
                    placeholder={f.placeholder} style={{ width: '100%', padding: '11px 14px', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
              ))}
              {config.pixChave && (
                <div style={{ background: '#E8F5E9', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#2E7D32', marginTop: '4px' }}>
                  🔑 <strong>{config.pixChave}</strong> ({config.pixTipo}) — {config.pixNome}
                </div>
              )}
            </div>
            <BtnPrimario onClick={handleSalvarConfig}>Salvar PIX</BtnPrimario>
          </>
        )}

        {aba === 'senha' && (
          <>
            <SectionTitle>Alterar senha</SectionTitle>
            <div style={{ background: 'white', borderRadius: '12px', padding: '14px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ background: '#FFF8E1', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: '#F57F17', marginBottom: '14px' }}>
                ⚠️ Ao trocar a senha, o administrador será notificado por email.
              </div>
              {[
                { label: 'Senha atual', val: senhaAtual, set: setSenhaAtual, ph: 'Sua senha atual' },
                { label: 'Nova senha', val: novaSenha, set: setNovaSenha, ph: 'Mínimo 6 caracteres' },
                { label: 'Confirmar nova senha', val: confirmar, set: setConfirmar, ph: 'Repita a nova senha' },
              ].map(f => (
                <div key={f.label} style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>{f.label}</label>
                  <input type="password" value={f.val} onChange={e => f.set(e.target.value)}
                    placeholder={f.ph} style={{ width: '100%', padding: '11px 14px', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>
            <BtnPrimario onClick={handleTrocarSenha} disabled={salvando}>
              {salvando ? 'Alterando...' : 'Alterar Senha'}
            </BtnPrimario>
          </>
        )}
      </div>
    </>
  )
}

export function getConfig() {
  const salvo = localStorage.getItem('cantinapp_config')
  return salvo ? JSON.parse(salvo) : {
    pixChave: '', pixTipo: 'telefone', pixNome: '',
    igrejaNome: 'ADEMJI', mensagemRodape: 'Obrigado pelo seu apoio! 🙏',
    tesourceiroNome: '', tesourceiroTelefone: ''
  }
}
