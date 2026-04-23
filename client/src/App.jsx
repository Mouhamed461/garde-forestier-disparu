import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import useAppareil from './hooks/useDevice'

import Accueil   from './pages/Accueil'
import Video     from './pages/Video'
import Choix     from './pages/Choix'
import Resultats from './pages/Resultats'

function RouteVideo() {
  const location = useLocation()
  const appareil = useAppareil()

  if (appareil === 'telephone' || appareil === 'tablette') {
    return <Navigate to="/choix" state={location.state} replace />
  }

  return <Video />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"          element={<Accueil />} />
      <Route path="/video"     element={<RouteVideo />} />
      <Route path="/choix"     element={<Choix />} />
      <Route path="/resultats" element={<Resultats />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
