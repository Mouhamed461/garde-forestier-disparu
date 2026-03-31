// Page d'accueil — choix du rôle Hôte ou Joueur
import React from 'react'

function Accueil() {
  return (
    <div className="page">
      <h1>Le Garde Forestier Disparu</h1>
      <p>Choisissez votre rôle pour commencer</p>

      {/* Bouton pour créer une session */}
      <button>Hôte — Créer une session</button>

      {/* Bouton pour rejoindre avec un code */}
      <button>Joueur — Rejoindre avec un code</button>
    </div>
  )
}

export default Accueil
