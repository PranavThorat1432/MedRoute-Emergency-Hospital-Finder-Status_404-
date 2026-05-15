import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import HospitalDetail from './pages/HospitalDetail'

export const backendURL = 'http://localhost:5000'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/hospital/:id" element={<HospitalDetail />} />
      </Routes>
    </BrowserRouter>
  )
}
