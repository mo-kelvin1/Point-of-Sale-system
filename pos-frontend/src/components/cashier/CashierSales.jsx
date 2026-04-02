import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import Modal from '../Modal'

const STORE_NAME = 'My Store'

export default function CashierSales() {
  const [view, setView] = useState('all') // 'all' or 'mine'
  const [sales, setSales] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [receiptSale, setReceiptSale] = useState(null)
  const [receiptOpen, setReceiptOpen] = useState(false)

  async function load(currentView) {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (currentView === 'mine') params.append('mine', 'true')
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      const data = await api.get(`/sales${params.toString() ? '?' + params : ''}`)
      setSales(data)
    } catch (err) {
      console.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(view) }, [view])

  function switchView(v) {
    setView(v)
  }

  async function openReceipt(id) {
    try {
      const sale = await api.get(`/sales/${id}`)
      setReceiptSale(sale)
      setReceiptOpen(true)
    } catch (err) { alert('Could not load receipt') }
  }

  const statusClass = s => s === 'COMPLETED' ? 'badge-success' : s === 'CANCELLED' ? 'badge-danger' : 'badge-warning'

  return (
    <div style={{ padding: 24 }}>
      <div className="section-header" style={{ marginBottom: 12 }}>
        <h2>Sales History</h2>
        <div className="date-filters">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          <button className="btn btn-outline" onClick={() => load(view)}>Filter</button>
        </div>
      </div>

      {/* All Sales / My Sales toggle */}
      <div className="history-sub-tabs">
        <button className={`history-sub-tab${view === 'all' ? ' active' : ''}`} onClick={() => switchView('all')}>
          All Sales
        </button>
        <button className={`history-sub-tab${view === 'mine' ? ' active' : ''}`} onClick={() => switchView('mine')}>
          My Sales
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Sale #</th><th>Date</th><th>Cashier</th><th>Customer</th>
              <th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Receipt</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</td></tr>
            )}
            {!loading && sales.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No sales found</td></tr>
            )}
            {!loading && sales.map(s => (
              <tr key={s.id}>
                <td>#{s.id}</td>
                <td>{new Date(s.createdAt).toLocaleString()}</td>
                <td>{s.user.fullName}</td>
                <td>{s.customer?.name || 'Walk-in'}</td>
                <td>{s.saleItems?.length ?? 0} item(s)</td>
                <td>${s.grandTotal.toFixed(2)}</td>
                <td>{s.payment?.method?.replace('_', ' ') || '-'}</td>
                <td><span className={`badge ${statusClass(s.status)}`}>{s.status}</span></td>
                <td>
                  <button className="btn btn-sm btn-outline" onClick={() => openReceipt(s.id)}>
                    Receipt
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Receipt reprint modal */}
      {receiptOpen && receiptSale && (
        <Modal
          title="Receipt"
          onClose={() => setReceiptOpen(false)}
          footer={<>
            <button className="btn btn-outline" onClick={() => window.print()}>Print</button>
            <button className="btn btn-primary" onClick={() => setReceiptOpen(false)}>Close</button>
          </>}
        >
          <div className="receipt">
            <div className="receipt-header">
              <h2>{STORE_NAME}</h2>
              <p>Official Receipt</p>
            </div>
            <hr className="receipt-divider" />
            <div><strong>Transaction #:</strong> {receiptSale.id}</div>
            <div><strong>Date:</strong> {new Date(receiptSale.createdAt).toLocaleString()}</div>
            <div><strong>Cashier:</strong> {receiptSale.user.fullName}</div>
            {receiptSale.customer && <div><strong>Customer:</strong> {receiptSale.customer.name}</div>}
            <hr className="receipt-divider" />
            {receiptSale.saleItems.map(i => (
              <div key={i.id} className="receipt-item">
                <span>{i.product.name} x{i.quantity} @ ${i.unitPrice.toFixed(2)}</span>
                <span>${i.subtotal.toFixed(2)}</span>
              </div>
            ))}
            <hr className="receipt-divider" />
            <div className="receipt-totals">
              <div className="receipt-total-row"><span>Subtotal</span><span>${receiptSale.totalAmount.toFixed(2)}</span></div>
              {receiptSale.discount > 0 && <div className="receipt-total-row"><span>Discount</span><span>-${receiptSale.discount.toFixed(2)}</span></div>}
              <div className="receipt-total-row"><span>Tax (10%)</span><span>${receiptSale.tax.toFixed(2)}</span></div>
              <div className="receipt-total-row final"><span>TOTAL</span><span>${receiptSale.grandTotal.toFixed(2)}</span></div>
              <div className="receipt-total-row"><span>Payment</span><span>{receiptSale.payment.method.replace('_', ' ')}</span></div>
              {receiptSale.payment.amountPaid > 0 && <div className="receipt-total-row"><span>Amount Paid</span><span>${receiptSale.payment.amountPaid.toFixed(2)}</span></div>}
              {receiptSale.payment.change > 0 && <div className="receipt-total-row"><span>Change</span><span>${receiptSale.payment.change.toFixed(2)}</span></div>}
            </div>
            <hr className="receipt-divider" />
            <div className="receipt-footer"><p>Thank you for shopping at {STORE_NAME}!</p></div>
          </div>
        </Modal>
      )}
    </div>
  )
}
