import { useState } from 'react'

import './App.css'
import { Routes, Route, Link } from 'react-router-dom'
import SIPCalculator from './SIPCalculator.jsx'

function Home() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div style={{ 
      minHeight: '100vh', 
      background: '#FFFAF1',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500&display=swap');
        
        .cta-button {
          transition: all 0.2s ease;
        }
        
        .cta-button:hover {
          background: #005530;
        }
      `}</style>

      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        <h1 style={{ 
          fontSize: 'clamp(2.5rem, 6vw, 3.5rem)',
          fontFamily: "'Playfair Display', serif",
          fontWeight: '700',
          color: '#004225',
          marginBottom: '16px',
          lineHeight: '1.1'
        }}>
          SIP Investment<br />Calculator
        </h1>
        
        <p style={{ 
          fontSize: '1.125rem',
          color: '#846C5B',
          marginBottom: '32px',
          lineHeight: '1.5'
        }}>
          Plan your wealth with systematic investments
        </p>
        
        <button className="cta-button" style={{
          background: '#004225',
          color: '#FFFAF1',
          padding: '14px 40px',
          fontSize: '1rem',
          fontWeight: '500',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}>
          
          <Link to="/sip">Get Started → SIP Calculator</Link>
        </button>
      </div>
    </div>
    </>
  )
}

function App() {
  return (
    <div>
      <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/">Home</Link>
          <Link to="/sip">SIP Calculator</Link>
        </nav>
       
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sip" element={<SIPCalculator />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
