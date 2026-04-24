// src/pages/Configuracoes.jsx
import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { TopBar, BtnPrimario, SectionTitle } from '../components/UI'
import { SenhaModal } from '../components/SenhaModal'

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api'
function getToken() { return localStorage.getItem('cantinapp_token') }

export function Configuracoes() {
  const { mostrarToast, ir } = useStore()
  const [config, setConfig] = useState({
    pixChave: '', pixTipo: 'telefone', pixNome: '',
    igrejaNome: 'ADEMJI', mensagemRodape: 'Obrigado pelo seu apoio!',
    adms: [], // lista de ADMs que podem receber pagamentos
  })
  const [novoAdm, setNovoAdm] = useState('')
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrarSenhaModal, setMostrarSenhaModal] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [aba, setAba] = useState('geral')

  useEffect(() => {
    const salvo = localStorage.getItem('cantinapp_config')
    if (salvo) {
      const parsed = JSON.parse(salvo)
      // compatibilidade com config antiga que tinha tesourceiroNome
      if (!parsed.adms) {
        parsed.adms = parsed.tesourceiroNome ? [parsed.tesourceiroNome] : []
      }
      setConfig(parsed)
    }
  }, [])

  const set = (k, v) => setConfig(prev => ({ ...prev, [k]: v }))

  const handleSalvarConfig = () => {
    localStorage.setItem('cantinapp_config', JSON.stringify(config))
    mostrarToast('Configuracoes salvas!')
  }

  const handleAdicionarAdm = () => {
    const nome = novoAdm.trim()
    if (!nome) { mostrarToast('Informe o nome do ADM!', 'erro'); return }
    if (config.adms.includes(nome)) { mostrarToast('ADM ja cadastrado!', 'erro'); return }
    set('adms', [...config.adms, nome])
    setNovoAdm('')
  }

  const handleRemoverAdm = (nome) => {
    set('adms', config.adms.filter(a => a !== nome))
  }

  const handleTrocarSenha = () => {
    if (!senhaAtual || !novaSenha || !confirmar) { mostrarToast('Preencha todos os campos', 'erro'); return }
    if (novaSenha !== confirmar) { mostrarToast('As senhas nao coincidem', 'erro'); return }
    if (novaSenha.length < 6) { mostrarToast('Minimo 6 caracteres', 'erro'); return }
    setMostrarSenhaModal(true)
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
      mostrarToast('Senha alterada!')
      setSenhaAtual(''); setNovaSenha(''); setConfirmar('')
    } catch (e) { mostrarToast(e.message, 'erro') }
    setSalvando(false)
  }

  const tiposPix = ['telefone', 'cpf', 'email', 'aleatoria']
  const abas = [['geral', 'Geral'], ['pix', 'PIX'], ['adm', 'ADM'], ['senha', 'Senha']]

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
      <TopBar titulo="Configuracoes" />
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
                { label: 'Mensagem de rodape (WhatsApp)', key: 'mensagemRodape', placeholder: 'Ex: Obrigado pelo apoio!' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>{f.label}</label>
                  <input value={config[f.key]} onChange={e => set(f.key, e.target.value)}
                    placeholder={f.placeholder} style={{ width: '100%', padding: '11px 14px', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>
            <BtnPrimario onClick={handleSalvarConfig}>Salvar Configuracoes</BtnPrimario>
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
                  Chave: <strong>{config.pixChave}</strong> ({config.pixTipo}) — {config.pixNome}
                </div>
              )}
            </div>
            <BtnPrimario onClick={handleSalvarConfig}>Salvar PIX</BtnPrimario>
          </>
        )}

        {aba === 'adm' && (
          <>
            <SectionTitle>ADMs que podem receber pagamentos</SectionTitle>
            <div style={{ background: 'white', borderRadius: '12px', padding: '14px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                Cadastre os nomes das pessoas autorizadas a receber pagamentos da cantina.
              </div>

              {/* Lista de ADMs */}
              {config.adms.length === 0 && (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#9E9E9E', fontSize: '13px' }}>
                  Nenhum ADM cadastrado ainda
                </div>
              )}
              {config.adms.map((adm, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: idx < config.adms.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#2E7D32', flexShrink: 0 }}>
                    {adm.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, fontSize: '14px', fontWeight: 500 }}>{adm}</div>
                  <button onClick={() => handleRemoverAdm(adm)} style={{ background: '#FFEBEE', color: '#D32F2F', border: 'none', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                    Remover
                  </button>
                </div>
              ))}

              {/* Adicionar novo ADM */}
              <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                <input
                  value={novoAdm}
                  onChange={e => setNovoAdm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdicionarAdm()}
                  placeholder="Nome do ADM"
                  style={{ flex: 1, padding: '11px 14px', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
                />
                <button onClick={handleAdicionarAdm} style={{ background: '#2E7D32', color: 'white', border: 'none', borderRadius: '10px', padding: '11px 16px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  + Add
                </button>
              </div>
            </div>
            <BtnPrimario onClick={handleSalvarConfig}>Salvar ADMs</BtnPrimario>
          </>
        )}

        {aba === 'senha' && (
          <>
            <SectionTitle>Alterar senha</SectionTitle>
            <div style={{ background: 'white', borderRadius: '12px', padding: '14px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ background: '#FFF8E1', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: '#F57F17', marginBottom: '14px' }}>
                Ao trocar a senha, o administrador sera notificado.
              </div>
              {[
                { label: 'Senha atual', val: senhaAtual, set: setSenhaAtual, ph: 'Sua senha atual' },
                { label: 'Nova senha', val: novaSenha, set: setNovaSenha, ph: 'Minimo 6 caracteres' },
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
  if (!salvo) return {
    pixChave: '', pixTipo: 'telefone', pixNome: '',
    igrejaNome: 'ADEMJI', mensagemRodape: 'Obrigado pelo seu apoio!',
    adms: []
  }
  const parsed = JSON.parse(salvo)
  if (!parsed.adms) parsed.adms = parsed.tesourceiroNome ? [parsed.tesourceiroNome] : []
  return parsed
}

