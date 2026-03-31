// Page de salle d'attente — affiche les joueurs connectés
import React from 'react'

function Lobby() {
  return (
    <div className="page">
      <h1>Salle d'attente</h1>

      {/* Code de session affiché pour l'hôte */}
      <p>Code de session : XXXXX</p>

      {/* Liste des joueurs — placeholder pour l'instant */}
      <ul>
        <li>Joueur 1 — En attente</li>
        <li>Joueur 2 — En attente</li>
      </ul>

      {/* Bouton de lancement — visible pour l'hôte seulement */}
      <button>Lancer l'expérience</button>
    </div>
  )
}

export default Lobby
