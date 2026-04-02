import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import Modal from '../Modal'

const EMPTY = { name: '', category: '', price: '', barcode: '', description: '', quantity: 0, lowStockAlert: 10, supplier: '' }

export default function Products() {
  const { user } = useAuth()
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [error, setError] = useState('')

  async function load() {
    const data = await api.get('/products')
    setProducts(data)
  }

  useEffect(() => { load() }, [])

  function openAdd() {
    setForm(EMPTY); setEditId(null); setError(''); setModal(true)
  }

  async function openEdit(p) {
    setForm({
      name: p.name, category: p.category, price: p.price,
      barcode: p.barcode || '', description: p.description || '',
      quantity: p.inventory?.quantity ?? 0,
      lowStockAlert: p.inventory?.lowStockAlert ?? 10,
      supplier: p.inventory?.supplier || '',
    })
    setEditId(p.id); setError(''); setModal(true)
  }

  async function save() {
    if (!form.name || !form.category || !form.price) {
      setError('Name, category and price are required'); return
    }
    try {
      if (editId) await api.put(`/products/${editId}`, form)
      else await api.post('/products', form)
      setModal(false); load()
    } catch (err) { setError(err.message) }
  }

  async function remove(id) {
    if (!confirm('Remove this product?')) return
    await api.delete(`/products/${id}`)
    load()
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode && p.barcode.includes(search)) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="section-header">
        <h2>Products</h2>
        {canEdit && <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>}
      </div>
      <div className="search-bar">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." />
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr><th>ID</th><th>Name</th><th>Category</th><th>Price</th><th>Barcode</th><th>Stock</th>{canEdit && <th>Actions</th>}</tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>${p.price.toFixed(2)}</td>
                <td>{p.barcode || '-'}</td>
                <td>{p.inventory?.quantity ?? 0}</td>
                {canEdit && (
                  <td>
                    <button className="btn btn-sm btn-outline" onClick={() => openEdit(p)}>Edit</button>{' '}
                    <button className="btn btn-sm btn-danger" onClick={() => remove(p.id)}>Delete</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal
          title={editId ? 'Edit Product' : 'Add Product'}
          onClose={() => setModal(false)}
          footer={<>
            <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>Save</button>
          </>}
        >
          <div className="form-row">
            <div className="form-group"><label>Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="form-group"><label>Category *</label><input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Price *</label><input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
            <div className="form-group"><label>Barcode</label><input value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Initial Stock</label><input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} /></div>
            <div className="form-group"><label>Low Stock Alert</label><input type="number" value={form.lowStockAlert} onChange={e => setForm(f => ({ ...f, lowStockAlert: e.target.value }))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Supplier</label><input value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} /></div>
            <div className="form-group"><label>Description</label><input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          </div>
          {error && <div className="error-message">{error}</div>}
        </Modal>
      )}
    </div>
  )
}
