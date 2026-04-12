import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { calculerFin } from '../scenario'
import './Resultats.css'

const FINS = {
  heros: {
    titre: 'MISSION ACCOMPLIE',
    sousTitre: 'HÉROS DE LA FORÊT',
    message: 'Jake est en forme. Il utilise sa corde pour remonter le blessé et allume un feu de signalisation. L\'hélicoptère les repère. Le randonneur est sauf. Mission accomplie.',
    couleur: '#27ae60',
    lueur: '#27ae6088',
    icone: '★',
  },
  survivant: {
    titre: 'RETOUR DIFFICILE',
    sousTitre: 'SURVIVANT',
    message: 'Jake n\'a plus la force de remonter le randonneur seul. Les secours arrivent finalement, mais Jake est évacué sur civière. Une mission semée d\'embûches.',
    couleur: '#e6b800',
    lueur: '#e6b80088',
    icone: '◆',
  },
  abandon: {
    titre: 'MISSION ÉCHOUÉE',
    sousTitre: 'ABANDON',
    message: 'Jake doit laisser le randonneur derrière lui. Il ne survit pas au froid. Une fin amère que personne n\'oubliera.',
    couleur: '#c0392b',
    lueur: '#c0392b88',
    icone: '✕',
  },
  echec: {
    titre: 'FIN PRÉMATURÉE',
    sousTitre: 'MISSION TERMINÉE',
    message: 'Une mauvaise décision a scellé le sort de Jake avant même d\'atteindre le randonneur.',
    couleur: '#7f1d1d',
    lueur: '#7f1d1d88',
    icone: '✕',
  },
}

function Resultats() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { code, nom, isHote, energie = 0, finType } = state || {}

  const typeFin = finType === 'echec' ? 'echec' : calculerFin(energie)
  const fin = FINS[typeFin]

  useEffect(() => {
    if (!fin) navigate('/', { replace: true })
  }, [fin, navigate])

  if (!fin) return null

  const barreWidth = Math.max(0, Math.min(100, energie))

  return (
    <div className="resultats-page">
      {/* Lucioles déco */}
      <div className="res-lucioles">
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} className="res-luciole" style={{
            left: Math.random() * 100 + '%',
            animationDelay: (Math.random() * 6) + 's',
            animationDuration: (4 + Math.random() * 5) + 's',
          }} />
        ))}
      </div>

      {/* Silhouettes arbres */}
      <div className="res-arbres" />

      <div className="resultats-contenu">
        {/* Icone fin */}
        <div className="fin-icone" style={{ color: fin.couleur, textShadow: `0 0 40px ${fin.lueur}` }}>
          {fin.icone}
        </div>

        {/* Titre */}
        <h1 className="fin-titre" style={{ color: fin.couleur }}>{fin.titre}</h1>
        <p className="fin-sous-titre">{fin.sousTitre}</p>

        {/* Message narratif */}
        <p className="fin-message">{fin.message}</p>

        {/* Barre énergie finale */}
        {finType !== 'echec' && (
          <div className="fin-energie">
            <span className="fin-energie-label">ÉNERGIE DU GROUPE</span>
            <div className="fin-energie-barre-fond">
              <div
                className="fin-energie-barre-remplie"
                style={{
                  width: barreWidth + '%',
                  background: energie > 50 ? '#27ae60' : energie > 20 ? '#e6b800' : '#c0392b',
                }}
              />
            </div>
            <span className="fin-energie-chiffre" style={{ color: fin.couleur }}>{energie}%</span>
          </div>
        )}

        {/* Séparateur */}
        <div className="fin-separateur" style={{ background: fin.couleur }} />

        {/* Info joueur */}
        <p className="fin-joueur">
          <span className="fin-joueur-point" style={{ background: fin.couleur }} />
          {nom || 'Joueur'}
        </p>

        {/* Bouton rejouer */}
        <button
          className="fin-bouton"
          style={{ '--couleur-fin': fin.couleur, '--lueur-fin': fin.lueur }}
          onClick={() => navigate('/')}
        >
          REJOUER
        </button>
      </div>
    </div>
  )
}

export default Resultats
