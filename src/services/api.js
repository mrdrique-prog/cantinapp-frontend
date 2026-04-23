// src/services/api.js
// URL da API — usa variável de ambiente em produção, localhost em dev
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api'

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('cantinapp_token')
    this.online = false
  }

  async checkOnline() {
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await fetch(`${apiBase}/health`, {
        signal: AbortSignal.timeout(6000)
      })
      this.online = res.ok
    } catch {
      this.online = false
    }
    return this.online
  }

  setToken(token) {
    this.token = token
    if (token) localStorage.setItem('cantinapp_token', token)
    else localStorage.removeItem('cantinapp_token')
  }

  async request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' }
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`
    const res = await fetch(`${BASE_URL}${path}`, {
      method, headers, body: body ? JSON.stringify(body) : null
    })
    if (res.status === 401) { this.setToken(null); window.location.reload(); return }
    const data = await res.json()
    if (!res.ok) throw new Error(data.erro || 'Erro na requisição')
    return data
  }

  get(path)        { return this.request('GET', path) }
  post(path, body) { return this.request('POST', path, body) }
  put(path, body)  { return this.request('PUT', path, body) }
  delete(path)     { return this.request('DELETE', path) }

  async login(email, senha) {
    const data = await this.post('/auth/login', { email, senha })
    this.setToken(data.token)
    return data
  }
  logout()  { this.setToken(null) }
  getMe()   { return this.get('/auth/me') }
  getPessoas()                 { return this.get('/pessoas') }
  getDashboard()               { return this.get('/relatorios/dashboard') }
  getDevedores()               { return this.get('/relatorios/devedores') }
  getRelatorioMensal(mes)      { return this.get(`/relatorios/mensal?mes=${mes}`) }
}

export const api = new ApiClient()

// URL base da API para uso direto nos componentes
export const API_URL = BASE_URL
export function getToken() { return localStorage.getItem('cantinapp_token') }
