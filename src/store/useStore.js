// src/store/useStore.js
import { create } from 'zustand'

export const useStore = create((set) => ({
  tela: 'dashboard',
  params: {},

  ir: (tela, params = {}) => set({ tela, params }),

  voltar: () => set({ tela: 'dashboard', params: {} }),

  // Toast
  toast: null,
  mostrarToast: (msg, tipo = 'sucesso') => {
    set({ toast: { msg, tipo } })
    setTimeout(() => set({ toast: null }), 2800)
  }
}))
