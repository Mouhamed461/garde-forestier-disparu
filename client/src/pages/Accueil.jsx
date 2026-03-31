// Page d'accueil — choix du rôle Hôte ou Joueur
import React from 'react'

function Accueil() {
  return (
    <div className="page home-page">
      <section className="home-center">
        <div className="home-hero">
          <h1 className="home-title">Le Garde Forestier Disparu</h1>
          <p className="home-tagline">Entrez dans les bois. Choisissez votre role et lancez la partie.</p>

          <div className="home-actions">
          {/* Bouton pour créer une session */}
            <button className="btn-main">Hote Creer une session</button>

            {/* Bouton pour rejoindre avec un code */}
            <button className="btn-ghost">Joueur Rejoindre avec un code</button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Accueil
