import { create } from 'zustand';

/**
 * Store quản lý thông báo (Toasts) Discord-style
 */
const useToastStore = create((set) => ({
  toasts: [],
  
  // Thêm thông báo mới
  addToast: (message, type = 'info') => {
    const id = Date.now();
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }]
    }));
    
    // Tự động xóa sau 5 giây
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
      }));
    }, 5000);
  },
  
  // Xóa thông báo thủ công
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter(t => t.id !== id)
    }));
  }
}));

export default useToastStore;
