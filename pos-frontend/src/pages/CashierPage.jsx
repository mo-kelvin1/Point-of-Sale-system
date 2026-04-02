import { useState } from 'react'
import Navbar from '../components/Navbar'
import Register from '../components/cashier/Register'
import CashierSales from '../components/cashier/CashierSales'

export default function CashierPage() {
  const [tab, setTab] = useState('register')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div className="cashier-tabs">
        <button className={`cashier-tab${tab === 'register' ? ' active' : ''}`} onClick={() => setTab('register')}>
          Register
        </button>
        <button className={`cashier-tab${tab === 'sales' ? ' active' : ''}`} onClick={() => setTab('sales')}>
          Sales History
        </button>
      </div>
      {tab === 'register' ? <Register /> : <CashierSales />}
    </div>
  )
}
