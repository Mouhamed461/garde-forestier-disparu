import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { calculerFin } from '../scenario'
import './Resultats.css'

const FINS = {
  heros: {
    titre: 'MISSION ACCOMPLIE',
    sousTitre: 'Héros de la forêt',
    message: 'Jake est en forme. Il utilise sa corde pour remonter le blessé et allume un feu de signalisation. L\'hélicoptère les repère. Le randonneur est sauf. Mission accomplie.',
    couleur: '#27ae60',
    lueur: '#27ae6055',
    icone: '★',
  },
  survivant: {
    titre: 'RETOUR DIFFICILE',
    sousTitre: 'Survivant',
    message: 'Jake n\'a plus la force de remonter le randonneur seul. Les secours arrivent finalement, mais Jake est évacué sur civière. Une mission semée d\'embûches.',
    couleur: '#e6b800',
    lueur: '#e6b80055',
    icone: '◆',
  },
  abandon: {
    titre: 'MISSION ÉCHOUÉE',
    sousTitre: 'Abandon',
    message: 'Jake doit laisser le randonneur derrière lui. Il ne survit pas au froid. Une fin amère que personne n\'oubliera.',
    couleur: '#c0392b',
    lueur: '#c0392b55',
    icone: '✕',
  },
  echec: {
    titre: 'FIN PRÉMATURÉE',
    sousTitre: 'Mission terminée',
    message: 'Une mauvaise décision a scellé le sort de Jake avant même d\'atteindre le randonneur.',
    couleur: '#7f1d1d',
    lueur: '#7f1d1d55',
    icone: '✕',
  },
}

function Resultats() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { nom, energie = 0, finType } = state || {}

  const typeFin = finType === 'echec' ? 'echec' : calculerFin(energie)
  const fin = FINS[typeFin]

  const imageFond = (typeFin === 'heros' || typeFin === 'survivant')
    ? '/assets/photos/victoire.jpg'
    : '/assets/photos/defaite.jpg'

  useEffect(() => {
    if (!fin) navigate('/', { replace: true })
  }, [fin, navigate])

  if (!fin) return null

  const barreWidth = Math.max(0, Math.min(100, energie))
  const couleurBarre = energie > 50 ? '#27ae60' : energie > 20 ? '#e6b800' : '#c0392b'

  return (
    <div
      className="resultats-page"
      style={{
        backgroundImage: `url('${imageFond}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="resultats-voile" />

      <div className="resultats-contenu">

        <p className="fin-tag">Jack Carter — Enquête Interactive</p>

        <div className="fin-badge" style={{ '--lueur': fin.lueur }}>
          <span className="fin-badge-icone" style={{ color: fin.couleur }}>{fin.icone}</span>
        </div>

        <h1 className="fin-titre" style={{ color: fin.couleur }}>{fin.titre}</h1>
        <p className="fin-sous-titre">{fin.sousTitre}</p>

        <div className="fin-separateur" style={{ background: fin.couleur }} />

        <p className="fin-message">{fin.message}</p>

        {finType !== 'echec' && (
          <div className="fin-energie">
            <span className="fin-energie-label">Énergie du groupe</span>
            <div className="fin-energie-barre-fond">
              <div
                className="fin-energie-barre-remplie"
                style={{ width: barreWidth + '%', background: couleurBarre }}
              />
            </div>
            <span className="fin-energie-chiffre" style={{ color: fin.couleur }}>{energie}%</span>
          </div>
        )}

        <div className="fin-footer">
          <p className="fin-joueur">
            <span className="fin-joueur-point" style={{ background: fin.couleur }} />
            {nom || 'Joueur'}
          </p>
          <button
            className="fin-bouton"
            style={{ '--couleur-fin': fin.couleur, '--lueur-fin': fin.lueur }}
            onClick={() => navigate('/')}
          >
            REJOUER
          </button>
        </div>

      </div>
    </div>
  )
}

export default Resultats
