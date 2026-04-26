export function ContaDetalhe() {
  const { params, ir, mostrarToast } = useStore()
  const pessoaId = parseInt(params.pessoaId)
  const [pessoa, setPessoa] = useState(null)
  const [extrato, setExtrato] = useState([])
  const [saldo, setSaldo] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [itemParaApagar, setItemParaApagar] = useState(null)

  const carregar = async () => {
    setCarregando(true)
    try {
      const [p, ext] = await Promise.all([
        apiGet(`/pessoas/${pessoaId}`),
        apiGet(`/pessoas/${pessoaId}/extrato`)
      ])
      setPessoa(p)
      setSaldo(p.saldo || 0)
      setExtrato(Array.isArray(ext) ? ext : [])
    } catch (e) {
      console.error('Erro ao carregar:', e)
      mostrarToast('Erro ao carregar extrato', 'erro')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    if (pessoaId) carregar()
  }, [pessoaId])

  const handleApagarVenda = async () => {
    try {
      await apiDelete(`/vendas/${itemParaApagar.vendaId}`)
      mostrarToast('Venda removida!')
      setItemParaApagar(null)
      await carregar()
    } catch (e) {
      mostrarToast('Erro ao apagar venda', 'erro')
      setItemParaApagar(null)
    }
  }

  return (
    <>
      {itemParaApagar && (
        <SenhaModal
          titulo="Confirmar exclusao"
          descricao={`Apagar venda de ${itemParaApagar.desc} (${formatData(itemParaApagar.data)})?`}
          onConfirmar={handleApagarVenda}
          onCancelar={() => setItemParaApagar(null)}
        />
      )}
      <TopBar titulo={pessoa?.nome || 'Carregando...'} />
      <div style={{ padding: '16px', paddingBottom: '24px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <Avatar nome={pessoa?.nome || ''} cor={avatarCor(pessoaId)} size={52} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 600 }}>{pessoa?.nome}</div>
            <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>{pessoa?.telefone}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#9E9E9E' }}>Saldo</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: saldo > 0 ? '#D32F2F' : '#2E7D32' }}>
              {formatMoeda(saldo)}
            </div>
          </div>
        </div>
        {saldo > 0 && (
          <BtnPrimario onClick={() => ir('pagamento', { pessoaId, saldo })} style={{ marginBottom: '16px' }}>
            Registrar Pagamento
          </BtnPrimario>
        )}
        <SectionTitle>Extrato ({extrato.length} lancamentos)</SectionTitle>
        {carregando && <div style={{ textAlign: 'center', padding: '20px', color: '#9E9E9E' }}>Carregando...</div>}
        <div style={{ background: 'white', borderRadius: '12px', padding: '0 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {extrato.length === 0 && !carregando && (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#9E9E9E', fontSize: '14px' }}>
              Nenhum lancamento
            </div>
          )}
          {extrato.map((item, idx) => (
            <div key={idx}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 0' }}>
                <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: item.tipo === 'compra' ? '#D32F2F' : '#2E7D32', marginTop: '5px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#1A1A1A' }}>{item.desc}</div>
                  <div style={{ fontSize: '11px', color: '#9E9E9E', marginTop: '2px' }}>
                    {formatData(item.data)}{item.domingoDesc ? ` - ${item.domingoDesc}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: item.valor < 0 ? '#D32F2F' : '#2E7D32' }}>
                    {item.valor < 0 ? '-' : '+'}{formatMoeda(Math.abs(item.valor))}
                  </div>
                  {item.tipo === 'compra' && item.vendaId && (
                    <button
                      onClick={() => setItemParaApagar(item)}
                      style={{
                        background: '#FFEBEE', color: '#D32F2F', border: 'none',
                        borderRadius: '6px', padding: '4px 8px', fontSize: '11px',
                        cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600
                      }}
                    >
                      Apagar
                    </button>
                  )}
                </div>
              </div>
              {idx < extrato.length - 1 && <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)' }} />}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
