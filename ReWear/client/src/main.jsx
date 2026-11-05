import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext.jsx'
import { WishlistProvider } from './context/WishListContext.jsx'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <WishlistProvider>
      <CartProvider>
        <App />
      </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  </StrictMode>,
)