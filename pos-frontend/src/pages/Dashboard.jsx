import { useState } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import Overview from '../components/dashboard/Overview'
import Products from '../components/dashboard/Products'
import Inventory from '../components/dashboard/Inventory'
import Customers from '../components/dashboard/Customers'
import SalesHistory from '../components/dashboard/SalesHistory'
import Reports from '../components/dashboard/Reports'
import Users from '../components/dashboard/Users'

const SECTIONS = [
  { key: 'overview',   label: 'Overview',       roles: ['ADMIN','MANAGER'] },
  { key: 'products',   label: 'Products',        roles: ['ADMIN','MANAGER'] },
  { key: 'inventory',  label: 'Inventory',       roles: ['ADMIN','MANAGER'] },
  { key: 'customers',  label: 'Customers',       roles: ['ADMIN','MANAGER'] },
  { key: 'sales',      label: 'Sales History',   roles: ['ADMIN','MANAGER'] },
  { key: 'reports',    label: 'Reports',         roles: ['ADMIN','MANAGER'] },
  { key: 'users',      label: 'Users',           roles: ['ADMIN'] },
]

const COMPONENTS = {
  overview:  Overview,
  products:  Products,
  inventory: Inventory,
  customers: Customers,
  sales:     SalesHistory,
  reports:   Reports,
  users:     Users,
}

export default function Dashboard() {
  const { user } = useAuth()
  const [active, setActive] = useState('overview')
  const Section = COMPONENTS[active]

  const visible = SECTIONS.filter(s => s.roles.includes(user?.role))

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div className="dashboard-layout">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            {visible.map(s => (
              <li key={s.key}>
                <a
                  href="#"
                  className={active === s.key ? 'active' : ''}
                  onClick={e => { e.preventDefault(); setActive(s.key) }}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </aside>
        <main className="dashboard-main">
          <Section />
        </main>
      </div>
    </div>
  )
}
