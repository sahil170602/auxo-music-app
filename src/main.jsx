import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { MusicProvider } from './context/MusicContext' // Import the provider
import Player from './components/Player' // Import the player UI

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* MusicProvider holds the global state of current song and queue */}
    <MusicProvider>
      <App />
      
      
    </MusicProvider>
  </StrictMode>,
)