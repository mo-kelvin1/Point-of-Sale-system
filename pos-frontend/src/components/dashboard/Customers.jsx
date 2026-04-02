import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import Modal from '../Modal'

const EMPTY = { name: '', phone: '', email: '', address: '' }

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [historyModal, setHistoryModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState(null)

  async function load() {
    const data = await api.get('/customers')
    setCustomers(data)
  }

  useEffect(() => { load() }, [])

  function openAdd() { setForm(EMPTY); setEditId(null); setError(''); setModal(true) }

  async function openEdit(c) {
    setForm({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '' })
    setEditId(c.id); setError(''); setModal(true)
  }

  async function viewHistory(id) {
    const data = await api.get(`/customers/${id}`)
    setHistory(data); setHistoryModal(true)
  }

  async function save() {
    if (!form.name) { setError('Name is required'); return }
    try {
      const payload = { ...form, phone: form.phone || null, email: form.email || null, address: form.address || null }
      if (editId) await api.put(`/customers/${editId}`, payload)
      else await api.post('/customers', payload)
      setModal(false); load()
    } catch (err) { setError(err.message) }
  }

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search)) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div>
      <div className="section-header">
        <h2>Customers</h2>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Customer</button>
      </div>
      <div className="search-bar">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..." />
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Loyalty Points</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.phone || '-'}</td>
                <td>{c.email || '-'}</td>
                <td>{c.loyaltyPoints} pts</td>
                <td>
                  <button className="btn btn-sm btn-outline" onClick={() => openEdit(c)}>Edit</button>{' '}
                  <button className="btn btn-sm btn-outline" onClick={() => viewHistory(c.id)}>History</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={editId ? 'Edit Customer' : 'Add Customer'} onClose={() => setModal(false)}
          footer={<><button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" onClick={save}>Save</button></>}>
          <div className="form-group"><label>Full Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div className="form-row">
            <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          </div>
          <div className="form-group"><label>Address</label><input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
          {error && <div className="error-message">{error}</div>}
        </Modal>
      )}

      {historyModal && history && (
        <Modal title={`${history.name} - Purchase History`} onClose={() => setHistoryModal(false)}
          footer={<button className="btn btn-outline" onClick={() => setHistoryModal(false)}>Close</button>}>
          <p style={{ marginBottom: 12, fontWeight: 600, color: 'var(--primary)' }}>Loyalty Points: {history.loyaltyPoints}</p>
          <table className="report-table">
            <thead><tr><th>Sale #</th><th>Date</th><th>Total</th><th>Payment</th></tr></thead>
            <tbody>
              {history.sales?.length ? history.sales.map(s => (
                <tr key={s.id}>
                  <td>#{s.id}</td>
                  <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td>${s.grandTotal.toFixed(2)}</td>
                  <td>{s.payment?.method?.replace('_', ' ') || '-'}</td>
                </tr>
              )) : <tr><td colSpan={4}>No purchases yet</td></tr>}
            </tbody>
          </table>
        </Modal>
      )}
    </div>
  )
}
