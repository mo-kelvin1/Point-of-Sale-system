import { useEffect, useState } from 'react'
import { api } from '../../api/client'

const TABS = [
  { key: 'daily',     label: 'Daily' },
  { key: 'weekly',    label: 'Weekly' },
  { key: 'products',  label: 'Products' },
  { key: 'cashiers',  label: 'Cashiers' },
  { key: 'inventory', label: 'Inventory' },
]

export default function Reports() {
  const [tab, setTab] = useState('daily')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadReport(tab) }, [tab])

  async function loadReport(type) {
    setLoading(true); setData(null)
    try {
      const res = await api.get(`/reports/${type}`)
      setData(res)
    } catch (err) {
      setData({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>Reports</h2>
      <div className="report-tabs">
        {TABS.map(t => (
          <button key={t.key} className={`tab-btn${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="report-content">
        {loading && <p style={{ color: 'var(--text-muted)' }}>Loading...</p>}
        {data?.error && <p style={{ color: 'var(--danger)' }}>{data.error}</p>}
        {!loading && data && !data.error && <ReportBody type={tab} data={data} />}
      </div>
    </div>
  )
}

function ReportBody({ type, data }) {
  if (type === 'daily') return (
    <>
      <div className="report-summary">
        <div className="report-summary-card"><div className="label">Revenue</div><div className="value">${data.totalRevenue.toFixed(2)}</div></div>
        <div className="report-summary-card"><div className="label">Transactions</div><div className="value">{data.totalTransactions}</div></div>
      </div>
      <h4 style={{ marginBottom: 10 }}>Top Products</h4>
      <table className="report-table">
        <thead><tr><th>Product</th><th>Qty Sold</th><th>Revenue</th></tr></thead>
        <tbody>
          {data.topProducts.length ? data.topProducts.map(p => (
            <tr key={p.name}><td>{p.name}</td><td>{p.quantity}</td><td>${p.revenue.toFixed(2)}</td></tr>
          )) : <tr><td colSpan={3}>No sales today</td></tr>}
        </tbody>
      </table>
    </>
  )

  if (type === 'weekly') return (
    <>
      <div className="report-summary">
        <div className="report-summary-card"><div className="label">Weekly Revenue</div><div className="value">${data.totalRevenue.toFixed(2)}</div></div>
        <div className="report-summary-card"><div className="label">Transactions</div><div className="value">{data.totalTransactions}</div></div>
      </div>
      <table className="report-table">
        <thead><tr><th>Date</th><th>Transactions</th><th>Revenue</th></tr></thead>
        <tbody>
          {data.dailyBreakdown.length ? data.dailyBreakdown.map(d => (
            <tr key={d.date}><td>{d.date}</td><td>{d.transactions}</td><td>${d.revenue.toFixed(2)}</td></tr>
          )) : <tr><td colSpan={3}>No data</td></tr>}
        </tbody>
      </table>
    </>
  )

  if (type === 'products') return (
    <table className="report-table">
      <thead><tr><th>Product</th><th>Category</th><th>Qty Sold</th><th>Revenue</th></tr></thead>
      <tbody>
        {data.length ? data.map(p => (
          <tr key={p.productId}><td>{p.name}</td><td>{p.category}</td><td>{p.totalQuantity}</td><td>${p.totalRevenue.toFixed(2)}</td></tr>
        )) : <tr><td colSpan={4}>No data</td></tr>}
      </tbody>
    </table>
  )

  if (type === 'cashiers') return (
    <table className="report-table">
      <thead><tr><th>Cashier</th><th>Username</th><th>Sales</th><th>Revenue</th></tr></thead>
      <tbody>
        {data.length ? data.map(c => (
          <tr key={c.userId}><td>{c.fullName}</td><td>{c.username}</td><td>{c.totalSales}</td><td>${c.totalRevenue.toFixed(2)}</td></tr>
        )) : <tr><td colSpan={4}>No data</td></tr>}
      </tbody>
    </table>
  )

  if (type === 'inventory') return (
    <>
      <div className="report-summary">
        <div className="report-summary-card"><div className="label">Low Stock Items</div><div className="value" style={{ color: 'var(--warning)' }}>{data.lowStockCount}</div></div>
      </div>
      <table className="report-table">
        <thead><tr><th>Product</th><th>Stock</th><th>Alert Level</th><th>Supplier</th><th>Status</th></tr></thead>
        <tbody>
          {data.inventory.map(i => (
            <tr key={i.productId}>
              <td>{i.product.name}</td><td>{i.quantity}</td><td>{i.lowStockAlert}</td><td>{i.supplier || '-'}</td>
              <td><span className={`badge ${i.isLowStock ? 'badge-warning' : 'badge-success'}`}>{i.isLowStock ? 'Low' : 'OK'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )

  return null
}
