import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [toast, setToast] = useState({ show: false, text: '' });
  const [modal, setModal] = useState({ show: false, content: null });
  const toastTimer = useRef(null);

  const showToast = useCallback((text) => {
    setToast({ show: true, text });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 3200);
  }, []);

  const openModal = useCallback((content) => setModal({ show: true, content }), []);
  const closeModal = useCallback(() => setModal({ show: false, content: null }), []);

  return (
    <UIContext.Provider value={{ showToast, openModal, closeModal }}>
      {children}
      <div className={`overlay${modal.show ? ' show' : ''}`} onClick={(e) => { if (e.target.classList.contains('overlay')) closeModal(); }}>
        <div className="modal">{modal.content}</div>
      </div>
      <div id="toast" className={toast.show ? 'show' : ''}>
        <span className="seal"></span>
        <span>{toast.text}</span>
      </div>
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}
