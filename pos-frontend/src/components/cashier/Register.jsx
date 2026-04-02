import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import Modal from '../Modal'

const STORE_NAME = 'My Store'
const TAX_RATE = 0.10

export default function Register() {
  const [allProducts, setAllProducts] = useState([])
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [cart, setCart] = useState([])
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [discount, setDiscount] = useState(0)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [customerOpen, setCustomerOpen] = useState(false)
  const [lastSale, setLastSale] = useState(null)
  const [payMethod, setPayMethod] = useState('CASH')
  const [amountPaid, setAmountPaid] = useState('')
  const [payRef, setPayRef] = useState('')
  const [checkoutError, setCheckoutError] = useState('')
  const [newCust, setNewCust] = useState({ name: '', phone: '', email: '' })

  const loadProducts = useCallback(async () => {
    try {
      const data = await api.get('/products')
      setAllProducts(data)
    } catch (err) { console.error(err.message) }
  }, [])

  const loadCustomers = useCallback(async () => {
    try {
      const data = await api.get('/customers')
      setCustomers(data)
    } catch (err) { console.error(err.message) }
  }, [])

  useEffect(() => { loadProducts(); loadCustomers() }, [loadProducts, loadCustomers])

  useEffect(() => {
    let filtered = allProducts
    if (category !== 'all') filtered = filtered.filter(p => p.category === category)
    if (search) filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search))
    )
    setProducts(filtered)
  }, [category, search, allProducts])

  const categories = ['all', ...[...new Set(allProducts.map(p => p.category))].sort()]

  async function handleBarcodeEnter(e) {
    if (e.key !== 'Enter' || !search.trim()) return
    try {
      const product = await api.get('/products/barcode/' + encodeURIComponent(search.trim()))
      addToCart(product)
      setSearch('')
    } catch (_) {}
  }

  function addToCart(product) {
    const stock = product.inventory ? product.inventory.quantity : 0
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id)
      const currentQty = existing ? existing.quantity : 0
      if (currentQty >= stock) { alert('Only ' + stock + ' units available for ' + product.name); return prev }
      if (existing) {
        return prev.map(i => i.productId === product.id
          ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unitPrice }
          : i)
      }
      return [...prev, { productId: product.id, name: product.name, unitPrice: product.price, quantity: 1, subtotal: product.price }]
    })
  }

  function updateQty(productId, delta) {
    setCart(prev =>
      prev.map(i => i.productId === productId
        ? { ...i, quantity: i.quantity + delta, subtotal: (i.quantity + delta) * i.unitPrice }
        : i
      ).filter(i => i.quantity > 0)
    )
  }

  function removeItem(productId) { setCart(prev => prev.filter(i => i.productId !== productId)) }

  function clearCart() { setCart([]); setDiscount(0); setCustomerId('') }

  const subtotal = cart.reduce((s, i) => s + i.subtotal, 0)
  const taxable = Math.max(0, subtotal - Number(discount))
  const tax = taxable * TAX_RATE
  const grandTotal = taxable + tax
  const change = Number(amountPaid) - grandTotal

  function openCheckout() {
    if (!cart.length) { alert('Cart is empty'); return }
    setPayMethod('CASH'); setAmountPaid(''); setPayRef(''); setCheckoutError('')
    setCheckoutOpen(true)
  }

  async function processPayment() {
    setCheckoutError('')
    if (payMethod === 'CASH' && Number(amountPaid) < grandTotal) {
      setCheckoutError('Amount tendered is less than the total'); return
    }
    try {
      const sale = await api.post('/sales', {
        customerId: customerId || null,
        items: cart.map(i => ({ productId: i.productId, quantity: i.quantity })),
        discount: Number(discount),
        tax,
        paymentMethod: payMethod,
        amountPaid: payMethod === 'CASH' ? Number(amountPaid) : grandTotal,
        paymentReference: payRef || null,
      })
      setLastSale(sale)
      setCheckoutOpen(false)
      setReceiptOpen(true)
      clearCart()
      loadProducts()
    } catch (err) { setCheckoutError(err.message) }
  }

  async function registerCustomer() {
    if (!newCust.name.trim()) { alert('Name is required'); return }
    try {
      const c = await api.post('/customers', {
        name: newCust.name, phone: newCust.phone || null, email: newCust.email || null,
      })
      setCustomers(prev => [...prev, c])
      setCustomerId(String(c.id))
      setCustomerOpen(false)
      setNewCust({ name: '', phone: '', email: '' })
    } catch (err) { alert(err.message) }
  }

  return (
    <div className="pos-layout">
      <div className="pos-products">
        <div className="search-bar">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleBarcodeEnter}
            placeholder="Scan barcode or search product..."
            autoFocus
          />
        </div>
        <div className="category-filter">
          {categories.map(cat => (
            <button key={cat} className={'filter-btn' + (category === cat ? ' active' : '')} onClick={() => setCategory(cat)}>
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
        <div className="product-grid">
          {products.map(p => {
            const stock = p.inventory ? p.inventory.quantity : 0
            return (
              <div key={p.id} className={'product-card' + (stock === 0 ? ' out-of-stock' : '')} onClick={() => stock > 0 && addToCart(p)}>
                <div className="product-name">{p.name}</div>
                <div className="product-price">${p.price.toFixed(2)}</div>
                <div className="product-stock">Stock: {stock}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="pos-cart">
        <div className="cart-header">
          <h3>Current Sale</h3>
          <div className="customer-select">
            <select value={customerId} onChange={e => setCustomerId(e.target.value)}>
              <option value="">Walk-in Customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}{c.phone ? ' - ' + c.phone : ''}</option>
              ))}
            </select>
            <button className="btn btn-sm btn-outline" onClick={() => setCustomerOpen(true)}>+ New</button>
          </div>
        </div>

        <div className="cart-items">
          {cart.length === 0
            ? <div className="cart-empty">No items in cart</div>
            : cart.map(item => (
              <div key={item.productId} className="cart-item">
                <div className="cart-item-name">{item.name}</div>
                <div className="cart-item-controls">
                  <button className="qty-btn" onClick={() => updateQty(item.productId, -1)}>-</button>
                  <span className="cart-item-qty">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => updateQty(item.productId, 1)}>+</button>
                </div>
                <div className="cart-item-price">${item.subtotal.toFixed(2)}</div>
                <button className="cart-item-remove" onClick={() => removeItem(item.productId)}>&times;</button>
              </div>
            ))
          }
        </div>

        <div className="cart-totals">
          <div className="total-row"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="total-row">
            <span>Discount ($)</span>
            <div className="discount-input">
              <input type="number" min="0" step="0.01" value={discount} onChange={e => setDiscount(e.target.value)} />
            </div>
          </div>
          <div className="total-row"><span>Tax (10%)</span><span>${tax.toFixed(2)}</span></div>
          <div className="total-row grand-total"><span>Total</span><span>${grandTotal.toFixed(2)}</span></div>
        </div>

        <div className="cart-actions">
          <button className="btn btn-danger btn-full" onClick={clearCart}>Clear Cart</button>
          <button className="btn btn-success btn-full" onClick={openCheckout}>Checkout</button>
        </div>
      </div>

      {checkoutOpen && (
        <Modal title="Complete Payment" onClose={() => setCheckoutOpen(false)}
          footer={<>
            <button className="btn btn-outline" onClick={() => setCheckoutOpen(false)}>Cancel</button>
            <button className="btn btn-success" onClick={processPayment}>Confirm Payment</button>
          </>}>
          <div className="payment-summary">Total Amount: <strong>${grandTotal.toFixed(2)}</strong></div>
          <div className="form-group" style={{ marginTop: 16 }}>
            <label>Payment Method</label>
            <div className="payment-methods">
              {['CASH', 'MOBILE_MONEY', 'CARD'].map(m => (
                <button key={m} className={'payment-btn' + (payMethod === m ? ' active' : '')} onClick={() => setPayMethod(m)}>
                  {m.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          {payMethod === 'CASH' && (
            <div className="form-group">
              <label>Amount Tendered</label>
              <input type="number" step="0.01" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder="0.00" />
              {Number(amountPaid) > 0 && (
                <div className="change-display" style={{ background: change < 0 ? '#fee2e2' : '#dcfce7', color: change < 0 ? 'var(--danger)' : 'var(--success)', marginTop: 8 }}>
                  Change: <strong>${Math.max(0, change).toFixed(2)}</strong>
                </div>
              )}
            </div>
          )}
          {payMethod !== 'CASH' && (
            <div className="form-group">
              <label>Reference / Transaction ID</label>
              <input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Enter reference number" />
            </div>
          )}
          {checkoutError && <div className="error-message">{checkoutError}</div>}
        </Modal>
      )}

      {receiptOpen && lastSale && (
        <Modal title="Receipt" onClose={() => setReceiptOpen(false)}
          footer={<>
            <button className="btn btn-outline" onClick={() => window.print()}>Print</button>
            <button className="btn btn-primary" onClick={() => setReceiptOpen(false)}>New Sale</button>
          </>}>
          <div className="receipt">
            <div className="receipt-header"><h2>{STORE_NAME}</h2><p>Official Receipt</p></div>
            <hr className="receipt-divider" />
            <div><strong>Transaction #:</strong> {lastSale.id}</div>
            <div><strong>Date:</strong> {new Date(lastSale.createdAt).toLocaleString()}</div>
            <div><strong>Cashier:</strong> {lastSale.user.fullName}</div>
            {lastSale.customer && <div><strong>Customer:</strong> {lastSale.customer.name}</div>}
            <hr className="receipt-divider" />
            {lastSale.saleItems.map(i => (
              <div key={i.id} className="receipt-item">
                <span>{i.product.name} x{i.quantity} @ ${i.unitPrice.toFixed(2)}</span>
                <span>${i.subtotal.toFixed(2)}</span>
              </div>
            ))}
            <hr className="receipt-divider" />
            <div className="receipt-totals">
              <div className="receipt-total-row"><span>Subtotal</span><span>${lastSale.totalAmount.toFixed(2)}</span></div>
              {lastSale.discount > 0 && <div className="receipt-total-row"><span>Discount</span><span>-${lastSale.discount.toFixed(2)}</span></div>}
              <div className="receipt-total-row"><span>Tax (10%)</span><span>${lastSale.tax.toFixed(2)}</span></div>
              <div className="receipt-total-row final"><span>TOTAL</span><span>${lastSale.grandTotal.toFixed(2)}</span></div>
              <div className="receipt-total-row"><span>Payment</span><span>{lastSale.payment.method.replace('_', ' ')}</span></div>
              {lastSale.payment.amountPaid > 0 && <div className="receipt-total-row"><span>Amount Paid</span><span>${lastSale.payment.amountPaid.toFixed(2)}</span></div>}
              {lastSale.payment.change > 0 && <div className="receipt-total-row"><span>Change</span><span>${lastSale.payment.change.toFixed(2)}</span></div>}
            </div>
            <hr className="receipt-divider" />
            <div className="receipt-footer"><p>Thank you for shopping at {STORE_NAME}!</p></div>
          </div>
        </Modal>
      )}

      {customerOpen && (
        <Modal title="Register Customer" onClose={() => setCustomerOpen(false)}
          footer={<>
            <button className="btn btn-outline" onClick={() => setCustomerOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={registerCustomer}>Register</button>
          </>}>
          <div className="form-group"><label>Full Name *</label><input value={newCust.name} onChange={e => setNewCust(f => ({ ...f, name: e.target.value }))} /></div>
          <div className="form-group"><label>Phone</label><input value={newCust.phone} onChange={e => setNewCust(f => ({ ...f, phone: e.target.value }))} /></div>
          <div className="form-group"><label>Email</label><input type="email" value={newCust.email} onChange={e => setNewCust(f => ({ ...f, email: e.target.value }))} /></div>
        </Modal>
      )}
    </div>
  )
}
