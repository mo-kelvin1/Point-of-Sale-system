import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Navbar({ extra }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <div className="nav-brand-icon">⬡</div>
        POS System
      </div>
      <div className="nav-links">
        <span>{user?.fullName}</span>
        <span className="role-badge">{user?.role}</span>
        {extra}
        <button onClick={handleLogout} className="btn btn-sm btn-danger">Logout</button>
      </div>
    </nav>
  )
}
