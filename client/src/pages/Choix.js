// Page de choix interactif — 4 options colorées avec timer
import React from 'react'

function Choix() {
  return (
    <div className="page">
      <h1>Faites votre choix</h1>

      {/* Timer — placeholder pour l'instant */}
      <p>Timer : 15</p>

      {/* Question — placeholder */}
      <p>Question de la séquence ici</p>

      {/* Les 4 boutons de choix colorés */}
      <div className="grille-choix">
        <button style={{ background: '#c0392b' }}>Rouge</button>
        <button style={{ background: '#2d6a4f' }}>Vert</button>
        <button style={{ background: '#1a3a5c' }}>Bleu</button>
        <button style={{ background: '#d4a017' }}>Jaune</button>
      </div>
    </div>
  )
}

export default Choix
