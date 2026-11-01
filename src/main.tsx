import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ToastProvider } from './contexto/ToastContext';
import { OficinaProvider } from './contexto/OficinaContext';
import { DetalheProvider } from './contexto/DetalheContext';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <ToastProvider>
    <OficinaProvider>
      <DetalheProvider>
        <App />
      </DetalheProvider>
    </OficinaProvider>
  </ToastProvider>,
);
