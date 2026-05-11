import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import socket from '../socket'
import { SEQUENCES, calculerFin, idVersIndex } from '../scenario'
import useAudio from '../hooks/useAudio'
import JaugeEnergie from '../components/JaugeEnergie'
import './Choix.css'

const COULEURS = [
  { id: 'rouge', label: 'ROUGE', hex: '#c0392b' },
  { id: 'vert',  label: 'VERT',  hex: '#27ae60' },
  { id: 'bleu',  label: 'BLEU',  hex: '#5b8dd9' },
  { id: 'jaune', label: 'JAUNE', hex: '#e6b800' },
]

const ease = [0.22, 1, 0.36, 1]

const varAttente = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
  exit:    { opacity: 0, y: -16, transition: { duration: 0.22 } },
}

const varVote = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
  exit:    { opacity: 0, transition: { duration: 0.18 } },
}

const varVoteItem = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease } },
}

const varGrille = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
}

const varBouton = {
  hidden:  { opacity: 0, scale: 0.7, y: 42 },
  visible: { opacity: 1, scale: 1,   y: 0,
    transition: { type: 'spring', stiffness: 360, damping: 22 } },
}

const varResultat = {
  hidden:  { opacity: 0, scale: 0.78 },
  visible: { opacity: 1, scale: 1,
    transition: { type: 'spring', stiffness: 280, damping: 20 } },
  exit:    { opacity: 0, scale: 0.9, transition: { duration: 0.18 } },
}

const varPopupOverlay = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.16 } },
  exit:    { opacity: 0, transition: { duration: 0.14 } },
}

const varPopupBoite = {
  hidden:  { opacity: 0, scale: 0.84, y: 28 },
  visible: { opacity: 1, scale: 1,    y: 0,
    transition: { type: 'spring', stiffness: 340, damping: 22 } },
  exit:    { opacity: 0, scale: 0.92, y: 12, transition: { duration: 0.14 } },
}

function Choix() {
  const { state }  = useLocation()
  const navigate   = useNavigate()
  const audio      = useAudio()

  const { code, nom, isHote, permutation = [], nomEquipe = '' } = state || {}

  const [seqIdx,  setSeqIdx]  = useState(state?.sequenceIndex ?? 0)
  const [energie, setEnergie] = useState(state?.energie       ?? 100)

  const sequence = SEQUENCES[seqIdx]

  const codeRef          = useRef(code)
  const nomRef           = useRef(nom)
  const seqIdxRef        = useRef(seqIdx)
  const navigateRef      = useRef(navigate)
  const isHoteRef        = useRef(isHote)
  const permutationRef   = useRef(permutation)
  const nomEquipeRef     = useRef(nomEquipe)
  codeRef.current        = code
  nomRef.current         = nom
  seqIdxRef.current      = seqIdx
  navigateRef.current    = navigate
  isHoteRef.current      = isHote
  permutationRef.current = permutation
  nomEquipeRef.current   = nomEquipe

  const [afficherChoix,       setAfficherChoix]       = useState(false)
  const [voteFait,            setVoteFait]            = useState(null)
  const [couleurGagnante,     setCouleurGagnante]     = useState(null)
  const [quizEchecActif,        setQuizEchecActif]        = useState(false)
  const [retourDebriefingActif, setRetourDebriefingActif] = useState(false)
  const [tempsRestant,        setTempsRestant]        = useState(sequence?.dureeTimer ?? 65)
  const [nbVotes,             setNbVotes]             = useState(0)
  const [nbJoueurs,           setNbJoueurs]           = useState(1)
  const [videoEnLecture,      setVideoEnLecture]      = useState(false)
  const [afficherConfirmQuit,   setAfficherConfirmQuit]   = useState(false)
  const [confirmationPendante, setConfirmationPendante] = useState(null) // 'recommencer' | 'quitter' | null
  // Vrai quand l'inventaire est entièrement affiché sur la Console et attend validation
  const [inventairePret,      setInventairePret]      = useState(false)
  // Vrai après la fin complète de l'animation du titre sur la Console
  const [titreFini,           setTitreFini]           = useState(false)
  // Plein écran tablette
  const [isFullscreen,        setIsFullscreen]        = useState(false)

  // Incrémenté à chaque "Recommencer" pour forcer useEffect([seqIdx, restartKey])
  // même quand seqIdx reste 0 (redémarrage depuis la séquence 0).
  const [restartKey, setRestartKey] = useState(0)

  // Guard : empêche d'émettre 'calculer-vote' deux fois si le timer expire
  // et la condition "tous votés" se déclenchent simultanément.
  const resultSoumisRef        = useRef(false)
  const timerRef               = useRef(null)
  // Stocke les données du résultat en attente du clic "Continuer" du joueur
  const pendingConsequenceRef  = useRef(null)

  // Conserve l'objet Audio retourné par timerBoucle() pour pouvoir l'arrêter
  // (pause) quand le timer se termine ou que les choix disparaissent.
  const timerLoopRef    = useRef(null)

  // voteFaitRef permet à soumettreResultat (appelé depuis le timer) de lire
  // le vote sans dépendre d'une closure sur l'état React.
  const voteFaitRef     = useRef(null)
  const audioRef        = useRef(audio)

  useEffect(() => {
    if (!code || !sequence) navigate('/', { replace: true })
  }, []) // eslint-disable-line

  // Wake Lock : empêche l'iPad de se mettre en veille pendant la partie
  useEffect(() => {
    let wakeLock = null
    async function acquirirWakeLock() {
      if (!('wakeLock' in navigator)) return
      try {
        wakeLock = await navigator.wakeLock.request('screen')
        wakeLock.addEventListener('release', () => {
          if (document.visibilityState === 'visible') acquirirWakeLock()
        })
      } catch (_) { /* batterie faible ou API non supportée */ }
    }
    async function onVisibilite() {
      if (document.visibilityState === 'visible') await acquirirWakeLock()
    }
    acquirirWakeLock()
    document.addEventListener('visibilitychange', onVisibilite)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilite)
      wakeLock?.release()
    }
  }, [])

  // Reconnexion automatique après veille/déverrouillage de l'iPad
  useEffect(() => {
    function rejoindre() {
      if (codeRef.current && nomRef.current) {
        socket.emit('rejoindre-session', { code: codeRef.current, nomJoueur: nomRef.current })
      }
    }
    socket.on('connect', rejoindre)
    return () => socket.off('connect', rejoindre)
  }, [])

  // Suivi de l'état plein écran
  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(
        !!(document.fullscreenElement || document.webkitFullscreenElement)
      )
    }
    document.addEventListener('fullscreenchange',       onFullscreenChange)
    document.addEventListener('webkitfullscreenchange', onFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange',       onFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange)
    }
  }, [])

  useEffect(() => {
    setAfficherChoix(false)
    setVoteFait(null)
    voteFaitRef.current = null
    setCouleurGagnante(null)
    setInventairePret(false)
    setTitreFini(false)
    setTempsRestant(sequence?.dureeTimer ?? 65)
    resultSoumisRef.current = false
    setVideoEnLecture(false)

    // Fallback : si la Console n'est pas connectée ou si titre-fini n'arrive pas,
    // déverrouille le bouton play après 12 s pour ne pas bloquer le joueur.
    const titreFallback = setTimeout(() => setTitreFini(true), 12000)

    // Les séquences quiz sans vidéo activent les choix immédiatement (type 'quiz' classique).
    // Pour 'quiz-connaissance', on attend l'événement 'afficher-choix' du serveur
    // (émis par la Console après son animation) pour rester synchronisé.
    if (sequence?.type === 'quiz') {
      const t = setTimeout(() => activerChoix(), 300)
      return () => { clearTimeout(t); clearTimeout(titreFallback) }
    }

    return () => clearTimeout(titreFallback)
  }, [seqIdx, restartKey]) // eslint-disable-line

  useEffect(() => {
    function onAfficherChoix() {
      activerChoix()
      setVideoEnLecture(false)
    }

    // Si tous les joueurs ont voté avant la fin du timer, la Console soumet
    // directement le résultat sans attendre l'expiration.
    function onVoteRecu({ nbVotes: v, nbJoueurs: j }) {
      setNbVotes(v)
      setNbJoueurs(j)
      if (v >= j && isHoteRef.current) {
        clearInterval(timerRef.current)
        soumettreResultat()
      }
    }

    function onAllerConsequence({ couleur, energie: nouvelleEnergie, consequence, nextSequence }) {
      clearInterval(timerRef.current)
      if (timerLoopRef.current) { timerLoopRef.current.pause(); timerLoopRef.current = null }
      setEnergie(nouvelleEnergie)

      // Quiz : mauvaise réponse → transition automatique (pas de bouton Continuer)
      if (consequence === 'quiz-echec') {
        audioRef.current.mauvaisChoix()
        setQuizEchecActif(true)
        setTimeout(() => {
          setQuizEchecActif(false)
          setSeqIdx(idVersIndex(1)) // id 1 = Opération Jack Carter = début
        }, 2500)
        return
      }

      // Retour au débriefing → transition automatique
      if (consequence === 'retour-debriefing') {
        audioRef.current.mauvaisChoix()
        setRetourDebriefingActif(true)
        setTimeout(() => {
          setRetourDebriefingActif(false)
          setEnergie(100)
          setSeqIdx(idVersIndex(1)) // id 1 = Opération Jack Carter = début
        }, 2500)
        return
      }

      setCouleurGagnante(couleur)

      const energieDelta = SEQUENCES[seqIdxRef.current]?.choix[couleur]?.energie ?? 0
      if (consequence === 'fin-prematuree' || energieDelta < 0) {
        audioRef.current.mauvaisChoix()
      } else {
        audioRef.current.bonChoix()
      }

      // Stocker les données — l'écran résultat reste affiché jusqu'au clic "Continuer".
      pendingConsequenceRef.current = { consequence, nextSequence, nouvelleEnergie }
    }

    // La Console signale que l'animation du titre est terminée → déverrouille le bouton play
    function onTitreFini() { setTitreFini(true) }

    // La Console signale que l'inventaire est entièrement affiché
    function onInventairePret() { setInventairePret(true) }

    function onVideoJouer() {
      setVideoEnLecture(true)
      // Si un résultat de vote est affiché, le basculer en mode télécommande :
      // la vidéo de conséquence vient de démarrer sur la Console.
      setCouleurGagnante(null)
    }
    function onVideoPause() { setVideoEnLecture(false) }

    // Console → Manette : la séquence suivante est prête — mettre à jour l'index ici
    // (et non dans continuerSequence) pour n'avancer qu'une fois la vidéo de conséquence
    // réellement terminée et la nouvelle séquence effectivement chargée côté Console.
    function onSequenceChange({ next }) {
      setSeqIdx(next)
    }

    function onRedemarrer() {
      clearInterval(timerRef.current)
      if (timerLoopRef.current) { timerLoopRef.current.pause(); timerLoopRef.current = null }
      pendingConsequenceRef.current = null
      setInventairePret(false)
      setTitreFini(false)
      setSeqIdx(idVersIndex(1)) // id 1 = Opération Jack Carter = début
      setEnergie(100)
      setAfficherChoix(false)
      setVoteFait(null)
      voteFaitRef.current = null
      setCouleurGagnante(null)
      setQuizEchecActif(false)
      setRetourDebriefingActif(false)
      resultSoumisRef.current = false
      setVideoEnLecture(false)
      setAfficherConfirmQuit(false)
      setConfirmationPendante(null)
      // Relance useEffect([seqIdx, restartKey]) même si seqIdx était déjà 0,
      // ce qui redémarre le timer de secours titreFini (12 s).
      setRestartKey(k => k + 1)
    }

    socket.on('titre-fini',        onTitreFini)
    socket.on('afficher-choix',    onAfficherChoix)
    socket.on('vote-recu',         onVoteRecu)
    socket.on('aller-consequence', onAllerConsequence)
    socket.on('inventaire-pret',   onInventairePret)
    socket.on('video-jouer',       onVideoJouer)
    socket.on('video-pause',       onVideoPause)
    socket.on('sequence-change',   onSequenceChange)
    socket.on('redemarrer',        onRedemarrer)

    return () => {
      socket.off('titre-fini',        onTitreFini)
      socket.off('afficher-choix',    onAfficherChoix)
      socket.off('vote-recu',         onVoteRecu)
      socket.off('aller-consequence', onAllerConsequence)
      socket.off('inventaire-pret',   onInventairePret)
      socket.off('video-jouer',       onVideoJouer)
      socket.off('video-pause',       onVideoPause)
      socket.off('sequence-change',   onSequenceChange)
      socket.off('redemarrer',        onRedemarrer)
      clearInterval(timerRef.current)
      if (timerLoopRef.current) { timerLoopRef.current.pause(); timerLoopRef.current = null }
    }
  }, []) // eslint-disable-line

  function activerChoix() {
    setAfficherChoix(true)
    setVoteFait(null)
    voteFaitRef.current = null
    demarrerTimer()
  }

  function demarrerTimer() {
    clearInterval(timerRef.current)
    let restant = SEQUENCES[seqIdxRef.current]?.dureeTimer ?? 35
    setTempsRestant(restant)
    timerRef.current = setInterval(() => {
      restant -= 1
      setTempsRestant(restant)
      // Lance la boucle sonore d'urgence à 5 secondes restantes.
      if (restant === 5) {
        timerLoopRef.current = audioRef.current.timerBoucle()
      }
      if (restant <= 0) {
        clearInterval(timerRef.current)
        if (timerLoopRef.current) { timerLoopRef.current.pause(); timerLoopRef.current = null }
        audioRef.current.tempsFini()
        // Seule la Console soumet le résultat à expiration pour éviter les doublons.
        if (isHoteRef.current) soumettreResultat()
      }
    }, 1000)
  }

  function voter(couleurId) {
    if (voteFaitRef.current) return
    audio.click()
    voteFaitRef.current = couleurId
    setVoteFait(couleurId)
    socket.emit('joueur-vote', { code: codeRef.current, couleur: couleurId })
  }

  function soumettreResultat() {
    if (resultSoumisRef.current) return
    resultSoumisRef.current = true
    socket.emit('calculer-vote', { code: codeRef.current, choix: SEQUENCES[seqIdxRef.current].choix })
  }

  function recommencerMission() {
    if (!isHoteRef.current) return
    socket.emit('redemarrer', { code: codeRef.current })
    setAfficherConfirmQuit(false)
    setConfirmationPendante(null)
  }

  function fermerPopup() {
    setAfficherConfirmQuit(false)
    setConfirmationPendante(null)
  }

  function validerInventaire() {
    setInventairePret(false)
    setTitreFini(false)   // Verrouille le bouton Play jusqu'au titre de la prochaine séquence
    setVideoEnLecture(false)
    socket.emit('valider-inventaire', { code: codeRef.current })
  }

  function rejouerInventaire() {
    setInventairePret(false)
    socket.emit('rejouer-video', { code: codeRef.current })
  }

  function passerVideo() {
    socket.emit('passer-video', { code: codeRef.current })
  }

  function continuerSequence() {
    const data = pendingConsequenceRef.current
    if (!data) return
    pendingConsequenceRef.current = null
    setCouleurGagnante(null)
    clearInterval(timerRef.current)

    // Notifier la Console pour qu'elle avance de son côté
    socket.emit('continuer-sequence', { code: codeRef.current })

    const { consequence, nextSequence, nouvelleEnergie } = data
    // nextSequence est un ID → convertir en index tableau
    const next = nextSequence !== undefined ? idVersIndex(nextSequence) : seqIdxRef.current + 1

    if (consequence === 'fin-prematuree') {
      navigate('/resultats', {
        state: { code: codeRef.current, nom, isHote, energie: nouvelleEnergie, finType: 'echec', permutation: permutationRef.current, nomEquipe: nomEquipeRef.current },
      })
      return
    }

    if (consequence === 'fin-jeu' || next >= SEQUENCES.length) {
      navigate('/resultats', {
        state: {
          code:        codeRef.current,
          nom,
          isHote,
          energie:     nouvelleEnergie,
          finType:     calculerFin(nouvelleEnergie),
          permutation: permutationRef.current,
          nomEquipe:   nomEquipeRef.current,
        }
      })
      return
    }

    // Transition normale : attendre 'sequence-change' de la Console.
    // La Manette reste sur le titre courant jusqu'à ce que la Console ait terminé
    // la vidéo de conséquence et charge effectivement la séquence suivante.
    setAfficherChoix(false)
    setVoteFait(null)
    voteFaitRef.current  = null
    resultSoumisRef.current = false
    setTitreFini(false)
  }

  function quitterSession() {
    socket.emit('quitter-session', { code: codeRef.current })
    window.location.replace('/')
  }

  function toggleFullscreen() {
    const el = document.documentElement
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      ;(el.requestFullscreen?.() ?? el.webkitRequestFullscreen?.())?.catch?.(() => {})
    } else {
      ;(document.exitFullscreen?.() ?? document.webkitExitFullscreen?.())?.catch?.(() => {})
    }
  }

  // Seule la Console (isHote) peut piloter la vidéo sur la page Video.jsx distante.
  function toggleVideo() {
    if (!isHoteRef.current) return
    if (videoEnLecture) {
      socket.emit('video-pause', { code: codeRef.current })
      setVideoEnLecture(false)
    } else {
      socket.emit('video-jouer', { code: codeRef.current })
      setVideoEnLecture(true)
    }
  }

  if (!sequence) return null

  function hexChoix(choixId) {
    const idx = COULEURS.findIndex(c => c.id === choixId)
    const displayId = permutation[idx] ?? choixId
    return COULEURS.find(c => c.id === displayId)?.hex ?? '#fff'
  }

  const actifs       = COULEURS.filter(c => sequence.choix[c.id])
  const couleurTimer = tempsRestant > 10 ? '#CB592E' : tempsRestant > 5 ? '#e6b800' : '#c0392b'

  return (
    <div className="choix-page">

      <header className="choix-entete">
        <span className="choix-nom">{nomEquipe || nom}</span>
        <div className="choix-entete-centre">
          <div className="choix-seq-prog">
            <div className="choix-seq-prog-fond">
              <div className="choix-seq-prog-fill" style={{ width: `${(seqIdx + 1) / SEQUENCES.length * 100}%` }} />
            </div>
            <span className="choix-seq-num">{seqIdx + 1}/{SEQUENCES.length}</span>
          </div>
          <JaugeEnergie valeur={energie} segments={10} taille="sm" />
        </div>
        <div className="choix-entete-droite">
          <button className="btn-fullscreen" onClick={toggleFullscreen} aria-label="Plein écran">
            {isFullscreen ? (
              <svg viewBox="0 0 24 24" className="fullscreen-icone" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="fullscreen-icone" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
              </svg>
            )}
          </button>
          <button className="btn-quitter" onClick={() => setAfficherConfirmQuit(true)} aria-label="Quitter la partie">
            <img src="/assets/icons/quitter.png" alt="" className="btn-quitter-icone" />
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {retourDebriefingActif ? (
          <motion.div
            key="retour-debriefing"
            className="choix-resultat"
            style={{ color: '#c0392b' }}
            variants={varResultat}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <p className="resultat-titre">Mission échouée</p>
            <JaugeEnergie valeur={energie} segments={10} taille="md" label />
            <p className="resultat-suite">Retour au débriefing…</p>
          </motion.div>

        ) : quizEchecActif ? (
          <motion.div
            key="quiz-echec"
            className="choix-resultat"
            style={{ color: '#c0392b' }}
            variants={varResultat}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <p className="resultat-titre">Mauvaise réponse</p>
            <JaugeEnergie valeur={energie} segments={10} taille="md" label />
            <p className="resultat-suite">Retour au débriefing…</p>
          </motion.div>

        ) : couleurGagnante ? (
          <motion.div
            key="resultat"
            className="choix-resultat"
            style={{ color: hexChoix(couleurGagnante) }}
            variants={varResultat}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <p className="resultat-titre">Choix du groupe</p>
            <p className="resultat-couleur">{sequence.choix[couleurGagnante]?.label}</p>
            <JaugeEnergie valeur={energie} segments={10} taille="md" label />
            <motion.button
            className="btn-continuer-sequence"
            onClick={continuerSequence}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.5, ease: [0.22, 1, 0.36, 1] } }}
            whileTap={{ scale: 0.95 }}
          >
            Continuer
          </motion.button>
          </motion.div>

        ) : afficherChoix ? (
          <motion.div
            key="vote"
            className="choix-vote"
            variants={varVote}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.p className="vote-invite" variants={varVoteItem}>CHOISISSEZ !</motion.p>

            <motion.div className="vote-header" variants={varVoteItem}>
              <div className="vote-cercle" style={{
                borderColor: couleurTimer,
                boxShadow: `0 0 20px ${couleurTimer}44`,
              }}>
                <span className="vote-timer">{tempsRestant}</span>
              </div>
              <span className="vote-compteur">{nbVotes} / {nbJoueurs} votes</span>
            </motion.div>

            <motion.div
              className={`vote-grille ${actifs.length === 2 ? 'vote-deux' : ''}`}
              variants={varGrille}
            >
              {actifs.map((c, i) => (
                <motion.button
                  key={c.id}
                  className={`vote-btn
                    ${voteFait === c.id              ? 'vote-selectionne' : ''}
                    ${voteFait && voteFait !== c.id   ? 'vote-estompe'     : ''}
                    ${!voteFait && tempsRestant <= 5  ? 'vote-urgence'     : ''}`}
                  style={{ '--couleur': hexChoix(c.id), '--i': i }}
                  onClick={() => voter(c.id)}
                  disabled={!!voteFait}
                  variants={varBouton}
                  whileTap={!voteFait ? { scale: 0.92 } : {}}
                >
                  <span className="vote-btn-label">
                    {sequence.choix[c.id]?.label || c.label}
                  </span>
                </motion.button>
              ))}
            </motion.div>

          </motion.div>

        ) : (
          <motion.div
            key="attente"
            className="choix-attente"
            variants={varAttente}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {isHote && (titreFini || videoEnLecture) && !inventairePret && (
              <motion.button
                className="hote-play-btn"
                onClick={toggleVideo}
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
                whileTap={{ scale: 0.94 }}
              >
                <img
                  className="hote-play-icone"
                  src={videoEnLecture ? '/assets/icons/pause.png' : '/assets/icons/play-button.png'}
                  alt=""
                />
                <span className="hote-play-label">
                  {videoEnLecture ? 'Pause' : 'Lancer la vidéo'}
                </span>
              </motion.button>
            )}

            {/* Bouton Skip — disponible pendant toute lecture vidéo */}
            {isHote && videoEnLecture && !inventairePret && (
              <motion.button
                className="btn-passer-video"
                onClick={passerVideo}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.3, delay: 0.5 } }}
                whileTap={{ scale: 0.94 }}
              >
                Passer la vidéo ›
              </motion.button>
            )}

            {/* Inventaire gelé : bouton Rejouer + bouton Continuer */}
            {isHote && inventairePret && (
              <motion.div
                className="inventaire-actions"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
              >
                <motion.button
                  className="btn-rejouer-video"
                  onClick={rejouerInventaire}
                  whileTap={{ scale: 0.94 }}
                >
                  ↺ Rejouer
                </motion.button>
                <motion.button
                  className="btn-continuer-sequence"
                  onClick={validerInventaire}
                  whileTap={{ scale: 0.95 }}
                >
                  Continuer
                </motion.button>
              </motion.div>
            )}

            {!isHote && (
              <>
                <div className="attente-icone">
                  <img src="/assets/icons/play-button.png" alt="" className="attente-icone-img" />
                </div>
                <p className="attente-titre">Regarde l'écran principal</p>
              </>
            )}

            <p className="attente-sous">{sequence.titre}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {afficherConfirmQuit && (
          <motion.div
            className="popup-overlay"
            onClick={fermerPopup}
            variants={varPopupOverlay}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              className="popup-boite"
              onClick={e => e.stopPropagation()}
              variants={varPopupBoite}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <AnimatePresence mode="wait">
                {!confirmationPendante ? (
                  <motion.div
                    key="choix-principal"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.18 } }}
                    exit={{ opacity: 0, y: -8, transition: { duration: 0.12 } }}
                  >
                    <p className="popup-titre">PAUSE</p>
                    <p className="popup-texte">Que souhaitez-vous faire ?</p>
                    <div className="popup-actions popup-actions-col">
                      {isHote && (
                        <button
                          className="popup-btn popup-recommencer"
                          onClick={() => setConfirmationPendante('recommencer')}
                        >
                          Recommencer la mission
                        </button>
                      )}
                      <button
                        className="popup-btn popup-confirmer"
                        onClick={() => setConfirmationPendante('quitter')}
                      >
                        Quitter la partie
                      </button>
                    </div>
                  </motion.div>

                ) : confirmationPendante === 'recommencer' ? (
                  <motion.div
                    key="confirm-recommencer"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.18 } }}
                    exit={{ opacity: 0, y: -8, transition: { duration: 0.12 } }}
                  >
                    <p className="popup-titre">RECOMMENCER ?</p>
                    <p className="popup-texte">
                      La mission reprend depuis le début.<br />L'énergie est réinitialisée à 100.
                    </p>
                    <div className="popup-actions popup-actions-col">
                      <button className="popup-btn popup-recommencer" onClick={recommencerMission}>
                        Confirmer
                      </button>
                      <button
                        className="popup-btn popup-annuler"
                        onClick={() => setConfirmationPendante(null)}
                      >
                        Annuler
                      </button>
                    </div>
                  </motion.div>

                ) : (
                  <motion.div
                    key="confirm-quitter"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.18 } }}
                    exit={{ opacity: 0, y: -8, transition: { duration: 0.12 } }}
                  >
                    <p className="popup-titre">QUITTER ?</p>
                    <p className="popup-texte">
                      La session sera détruite pour tous les joueurs.
                    </p>
                    <div className="popup-actions popup-actions-col">
                      <button className="popup-btn popup-confirmer" onClick={quitterSession}>
                        Quitter la partie
                      </button>
                      <button
                        className="popup-btn popup-annuler"
                        onClick={() => setConfirmationPendante(null)}
                      >
                        Annuler
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

export default Choix
