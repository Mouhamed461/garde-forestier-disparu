import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { calculerFin } from '../scenario'
import socket from '../socket'
import useAppareil from '../hooks/useDevice'
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

const ease = [0.22, 1, 0.36, 1]

const varPage = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.11, delayChildren: 0.15 } },
}

const varItem = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
}

const varBadge = {
  hidden:  { opacity: 0, scale: 0.2, rotate: -18 },
  visible: { opacity: 1, scale: 1,   rotate: 0,
    transition: { type: 'spring', stiffness: 240, damping: 18, delay: 0.2 } },
}

const varBarre = {
  hidden:  { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 0.55, ease, delay: 0.05 } },
}

function Resultats() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { nom, energie = 0, finType, code, nomEquipe = '' } = state || {}
  const appareil = useAppareil()

  // 'echec' court-circuite calculerFin : une fin prématurée est toujours affichée
  // comme telle, quelle que soit l'énergie restante transmise par le serveur.
  const typeFin = finType === 'echec' ? 'echec' : calculerFin(energie)
  const fin = FINS[typeFin]

  // Photo de fond : victoire pour les deux fins positives, défaite sinon.
  const imageFond = (typeFin === 'heros' || typeFin === 'survivant')
    ? '/assets/photos/victoire.jpg'
    : '/assets/photos/defaite.jpg'

  useEffect(() => {
    if (!fin) navigate('/', { replace: true })
  }, [fin, navigate])

  // La Console attend que la Manette déclenche le recommencer.
  useEffect(() => {
    function onRecommencer() { window.location.replace('/') }
    socket.on('recommencer', onRecommencer)
    return () => socket.off('recommencer', onRecommencer)
  }, [])

  function recommencer() {
    socket.emit('recommencer', { code })
    window.location.replace('/')
  }

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

      <motion.div
        className="resultats-contenu"
        variants={varPage}
        initial="hidden"
        animate="visible"
      >
        <motion.p className="fin-tag" variants={varItem}>
          Jack Carter — Enquête Interactive
        </motion.p>

        {nomEquipe && (
          <motion.p className="fin-equipe" variants={varItem}>
            {nomEquipe}
          </motion.p>
        )}

        <motion.div className="fin-badge" style={{ '--lueur': fin.lueur }} variants={varBadge}>
          <span className="fin-badge-icone" style={{ color: fin.couleur }}>{fin.icone}</span>
        </motion.div>

        <motion.h1 className="fin-titre" style={{ color: fin.couleur }} variants={varItem}>
          {fin.titre}
        </motion.h1>

        <motion.p className="fin-sous-titre" variants={varItem}>
          {fin.sousTitre}
        </motion.p>

        <motion.div
          className="fin-separateur"
          style={{ background: fin.couleur, originX: 0 }}
          variants={varBarre}
        />

        <motion.p className="fin-message" variants={varItem}>
          {fin.message}
        </motion.p>

        {/* La jauge d'énergie est masquée pour 'echec' : l'énergie a été forcée
            à 0 par le serveur et n'est pas représentative du parcours du groupe. */}
        {finType !== 'echec' && (
          <motion.div className="fin-energie" variants={varItem}>
            <span className="fin-energie-label">Énergie du groupe</span>
            <div className="fin-energie-barre-fond">
              <div
                className="fin-energie-barre-remplie"
                style={{ width: barreWidth + '%', background: couleurBarre }}
              />
            </div>
            <span className="fin-energie-chiffre" style={{ color: fin.couleur }}>{energie}%</span>
          </motion.div>
        )}

        <motion.div className="fin-footer" variants={varItem}>
          <p className="fin-joueur">
            <span className="fin-joueur-point" style={{ background: fin.couleur }} />
            {nom || 'Joueur'}
          </p>
          {appareil === 'manette' && (
            <motion.button
              className="fin-bouton"
              style={{ '--couleur-fin': fin.couleur, '--lueur-fin': fin.lueur }}
              onClick={recommencer}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              RECOMMENCER
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Resultats
