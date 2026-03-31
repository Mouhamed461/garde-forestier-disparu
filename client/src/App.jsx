// Fichier principal — routing entre toutes les pages
import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Accueil from './pages/Accueil'
import Lobby from './pages/Lobby'
import Video from './pages/Video'
import Choix from './pages/Choix'
import Resultats from './pages/Resultats'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Page d'accueil */}
        <Route path="/" element={<Accueil />} />

        {/* Salle d'attente */}
        <Route path="/lobby" element={<Lobby />} />

        {/* Lecteur vidéo */}
        <Route path="/video" element={<Video />} />

        {/* Écran de choix */}
        <Route path="/choix" element={<Choix />} />

        {/* Résultats finaux */}
        <Route path="/resultats" element={<Resultats />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
