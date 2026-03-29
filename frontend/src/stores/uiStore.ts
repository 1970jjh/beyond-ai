import { create } from 'zustand'

export interface Toast {
  readonly id: string
  readonly message: string
  readonly type: 'success' | 'error' | 'info' | 'warning'
  readonly duration: number
}

interface UIState {
  readonly isSidebarOpen: boolean
  readonly isEventPopupOpen: boolean
  readonly toasts: ReadonlyArray<Toast>
  readonly activeModal: string | null
  readonly modalData: unknown
}

interface UIActions {
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  showEventPopup: () => void
  hideEventPopup: () => void
  addToast: (message: string, type?: Toast['type'], duration?: number) => void
  removeToast: (id: string) => void
  openModal: (modalId: string, data?: unknown) => void
  closeModal: () => void
}

type UIStore = UIState & UIActions

export const useUIStore = create<UIStore>((set, get) => ({
  isSidebarOpen: false,
  isEventPopupOpen: false,
  toasts: [],
  activeModal: null,
  modalData: null,

  toggleSidebar: () => set({ isSidebarOpen: !get().isSidebarOpen }),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  showEventPopup: () => set({ isEventPopupOpen: true }),
  hideEventPopup: () => set({ isEventPopupOpen: false }),

  addToast: (message, type = 'info', duration = 3000) => {
    const id = crypto.randomUUID()
    const toast: Toast = { id, message, type, duration }
    set({ toasts: [...get().toasts, toast] })
    setTimeout(() => get().removeToast(id), duration)
  },

  removeToast: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) })
  },

  openModal: (modalId, data) => set({ activeModal: modalId, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
}))
