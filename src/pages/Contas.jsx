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
        <div style={{ background: 'white', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'center
