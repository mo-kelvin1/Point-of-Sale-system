import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import Modal from '../Modal'

export default function SalesHistory() {
  const { user } = useAuth()
  const canCancel = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const [sales, setSales] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [detail, setDetail] = useState(null)
  const [detailModal, setDetailModal] = useState(false)

  async function load() {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    const data = await api.get(`/sales${params.toString() ? '?' + params : ''}`)
    setSales(data)
  }

  useEffect(() => { load() }, [])

  async function viewSale(id) {
    const data = await api.get(`/sales/${id}`)
    setDetail(data); setDetailModal(true)
  }

  async function cancelSale(id) {
    if (!confirm('Cancel this sale and restore stock?')) return
    await api.put(`/sales/${id}/cancel`, {})
    setDetailModal(false); load()
  }

  const statusClass = s => s === 'COMPLETED' ? 'badge-success' : s === 'CANCELLED' ? 'badge-danger' : 'badge-warning'

  return (
    <div>
      <div className="section-header">
        <h2>Sales History</h2>
        <div className="date-filters">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          <button className="btn btn-outline" onClick={load}>Filter</button>
        </div>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>ID</th><th>Date</th><th>Cashier</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {sales.map(s => (
              <tr key={s.id}>
                <td>#{s.id}</td>
                <td>{new Date(s.createdAt).toLocaleString()}</td>
                <td>{s.user.fullName}</td>
                <td>{s.customer?.name || 'Walk-in'}</td>
                <td>${s.grandTotal.toFixed(2)}</td>
                <td>{s.payment?.method?.replace('_', ' ') || '-'}</td>
                <td><span className={`badge ${statusClass(s.status)}`}>{s.status}</span></td>
                <td><button className="btn btn-sm btn-outline" onClick={() => viewSale(s.id)}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detailModal && detail && (
        <Modal title="Sale Details" onClose={() => setDetailModal(false)}
          footer={<>
            <button className="btn btn-outline" onClick={() => setDetailModal(false)}>Close</button>
            {canCancel && detail.status === 'COMPLETED' && (
              <button className="btn btn-warning" onClick={() => cancelSale(detail.id)}>Cancel Sale</button>
            )}
          </>}>
          <div style={{ marginBottom: 12 }}>
            <strong>Transaction #{detail.id}</strong>{' '}
            <span className={`badge ${statusClass(detail.status)}`}>{detail.status}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16, fontSize: 13 }}>
            <div><strong>Date:</strong> {new Date(detail.createdAt).toLocaleString()}</div>
            <div><strong>Cashier:</strong> {detail.user.fullName}</div>
            <div><strong>Customer:</strong> {detail.customer?.name || 'Walk-in'}</div>
            <div><strong>Payment:</strong> {detail.payment?.method?.replace('_', ' ') || '-'}</div>
          </div>
          <table className="report-table">
            <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
            <tbody>
              {detail.saleItems.map(i => (
                <tr key={i.id}><td>{i.product.name}</td><td>{i.quantity}</td><td>${i.unitPrice.toFixed(2)}</td><td>${i.subtotal.toFixed(2)}</td></tr>
              ))}
            </tbody>
          </table>
          <div style={{ textAlign: 'right', marginTop: 12, fontSize: 13 }}>
            <div>Subtotal: ${detail.totalAmount.toFixed(2)}</div>
            {detail.discount > 0 && <div>Discount: -${detail.discount.toFixed(2)}</div>}
            <div>Tax: ${detail.tax.toFixed(2)}</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 6 }}>Total: ${detail.grandTotal.toFixed(2)}</div>
            {detail.payment?.change > 0 && <div>Change: ${detail.payment.change.toFixed(2)}</div>}
          </div>
        </Modal>
      )}
    </div>
  )
}
