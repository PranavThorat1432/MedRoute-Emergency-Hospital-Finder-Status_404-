import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import HospitalForm from './pages/HospitalForm'

function PrivateRoute({ children }) {
  return localStorage.getItem('adminToken') ? children : <Navigate to="/login" replace />
}

export const backendURL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/hospitals/new" element={<PrivateRoute><HospitalForm /></PrivateRoute>} />
        <Route path="/hospitals/:id/edit" element={<PrivateRoute><HospitalForm /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
