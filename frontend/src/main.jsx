import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Real-time live reload when served from FastAPI on port 8787
if (typeof window !== 'undefined' && window.EventSource) {
  try {
    const es = new EventSource('/api/dev/live-reload');
    es.onmessage = (e) => {
      if (e.data === 'reload') {
        console.log('[RHD DESC] Live rebuild detected. Reloading in real time...');
        window.location.reload();
      }
    };
    es.onerror = () => {
      // Quietly wait for server reconnect
    };
  } catch (err) {
    // Ignore in unsupported environments
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
