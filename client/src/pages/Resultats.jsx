// Page de résultats et fin de session
import React from 'react'

function Resultats() {
  return (
    <div className="page">
      <h1>Résultats</h1>

      {/* Barres de vote — placeholder */}
      <p>Rouge — 1 vote</p>
      <p>Vert — 2 votes</p>
      <p>Bleu — 0 vote</p>
      <p>Jaune — 0 vote</p>

      {/* Fin débloquée selon les choix */}
      <h2>Fin débloquée — placeholder</h2>

      <button>Rejouer</button>
    </div>
  )
}

export default Resultats
