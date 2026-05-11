import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import socket from '../socket'
import { SEQUENCES, calculerFin, idVersIndex } from '../scenario'
import sequencesData from '../data/sequences'
import SceneDescription from '../components/SceneDescription'
import JaugeEnergie from '../components/JaugeEnergie'
import './Video.css'

const COULEURS = [
  { id: 'rouge',  label: 'ROUGE',  hex: '#c0392b' },
  { id: 'vert',   label: 'VERT',   hex: '#27ae60' },
  { id: 'bleu',   label: 'BLEU',   hex: '#5b8dd9' },
  { id: 'jaune',  label: 'JAUNE',  hex: '#e6b800' },
]

function Video() {
  const { state } = useLocation()
  const navigate  = useNavigate()
  const { code, nom, isHote, sequenceIndex = 0, energie = 100, permutation = [], texteChoixPrecedent = '', partieKey = 0, nomEquipe = '' } = state || {}

  const sequence = SEQUENCES[sequenceIndex]

  const videoRef       = useRef(null)
  const isHoteRef      = useRef(isHote)
  const codeRef        = useRef(code)
  const sequenceRef    = useRef(sequence)
  const navigateRef    = useRef(navigate)
  const sequenceIdxRef = useRef(sequenceIndex)
  const nomRef         = useRef(nom)
  const energieRef     = useRef(energie)

  isHoteRef.current      = isHote
  codeRef.current        = code
  sequenceRef.current    = sequence
  navigateRef.current    = navigate
  sequenceIdxRef.current = sequenceIndex
  nomRef.current         = nom
  energieRef.current     = energie

  const [progression,     setProgression]     = useState(0)
  const [duree,           setDuree]           = useState(0)
  const [afficherChoix,   setAfficherChoix]   = useState(false)
  const [resultat,        setResultat]        = useState(null)
  const [energieAnimee,   setEnergieAnimee]   = useState(energie)
  const [phaseTitre,      setPhaseTitre]      = useState(true)
  const [titreTexte,      setTitreTexte]      = useState('')
  const [sousTitreActuel, setSousTitreActuel] = useState(null)
  const [phaseItems,           setPhaseItems]           = useState(false)
  // Texte du choix précédent affiché au début de chaque nouvelle séquence
  const [phaseChoixPrecedent, setPhaseChoixPrecedent] = useState(!!texteChoixPrecedent && sequenceIndex > 0)
  // Prompt "choisissez" affiché brièvement sur la Console quand la vidéo se termine
  const [afficherPromptChoix, setAfficherPromptChoix] = useState(false)
  // Vrai tant que la vidéo n'a jamais démarré dans cette séquence (indicateur de lecture)
  const [videoJamaisLancee,   setVideoJamaisLancee]   = useState(true)

  const partieKeyRef            = useRef(partieKey)
  const nomEquipeRef            = useRef(nomEquipe)
  const permutationRef          = useRef(permutation)
  const sousTitresMontresRef    = useRef(new Set())
  const sousTitreTimerRef       = useRef(null)
  // Empêche surFinVideo de tirer quand la vidéo de conséquence se termine
  const enPhaseConsequenceRef   = useRef(false)
  // Stocke les données de navigation en attente du clic "Continuer" de la Manette
  const pendingNavigationRef    = useRef(null)
  // Permet aux handlers socket (closures stales) d'appeler la version à jour de surFinVideo
  const surFinVideoRef          = useRef(null)
  const afficherChoixRef        = useRef(false)
  const phaseItemsRef           = useRef(false)
  // consequenceVideoPlayFnRef : chemin (string) de la vidéo de conséquence en attente de Play.
  // consequenceVideoTimerRef  : conservé pour clearTimeout de sécurité dans onRedemarrer.
  // continuerClickedRef       : vrai quand "Continuer" a été cliqué avant la fin de la vidéo.
  const consequenceVideoTimerRef  = useRef(null)
  const consequenceVideoPlayFnRef = useRef(null)
  const continuerClickedRef       = useRef(false)

  partieKeyRef.current     = partieKey
  nomEquipeRef.current     = nomEquipe
  permutationRef.current   = permutation
  afficherChoixRef.current = afficherChoix
  phaseItemsRef.current    = phaseItems

  useEffect(() => {
    if (!code || !sequence) navigate('/', { replace: true })
  }, []) // eslint-disable-line

  // Dismiss automatique de l'overlay texte précédent après 5 secondes
  useEffect(() => {
    if (!texteChoixPrecedent || sequenceIndex === 0) return
    const t = setTimeout(() => setPhaseChoixPrecedent(false), 5000)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line

  useEffect(() => {
    function rejoindre() {
      if (codeRef.current) socket.emit('rejoindre-video', { code: codeRef.current })
    }
    rejoindre()
    socket.on('connect', rejoindre)
    return () => socket.off('connect', rejoindre)
  }, []) // eslint-disable-line

  // Titre typewriter — écrit puis efface sans bloquer la vidéo
  useEffect(() => {
    setProgression(0)
    setDuree(0)
    setAfficherChoix(false)
    setResultat(null)
    setSousTitreActuel(null)
    setPhaseItems(false)
    setAfficherPromptChoix(false)
    setVideoJamaisLancee(true)
    sousTitresMontresRef.current = new Set()
    clearTimeout(sousTitreTimerRef.current)
    clearTimeout(consequenceVideoTimerRef.current)
    consequenceVideoTimerRef.current  = null
    consequenceVideoPlayFnRef.current = null
    continuerClickedRef.current       = false
    enPhaseConsequenceRef.current     = false

    const titre = sequence?.titre || ''
    setPhaseTitre(true)
    setTitreTexte('')

    let pauseTimer = null
    let eraseTimer = null
    let i = 0
    const writeTimer = setInterval(() => {
      i++
      setTitreTexte(titre.slice(0, i))
      if (i >= titre.length) {
        clearInterval(writeTimer)
        pauseTimer = setTimeout(() => { // 2500 ms pour laisser le temps de lire le titre
          let j = titre.length
          eraseTimer = setInterval(() => {
            j--
            setTitreTexte(titre.slice(0, j))
            if (j <= 0) {
              clearInterval(eraseTimer)
              setPhaseTitre(false)
              socket.emit('titre-fini', codeRef.current)
              if (sequence?.type === 'quiz' || sequence?.type === 'quiz-connaissance') {
                activerModeChoix()
                // Pour quiz-connaissance : signaler à la Manette que les choix sont prêts
                if (sequence?.type === 'quiz-connaissance') {
                  socket.emit('video-fin', codeRef.current)
                }
              }
            }
          }, 35)
        }, 2500)
      }
    }, 60)

    return () => {
      clearInterval(writeTimer)
      clearTimeout(pauseTimer)
      clearInterval(eraseTimer)
    }
  }, [sequenceIndex]) // eslint-disable-line

  useEffect(() => {
    if (!resultat) return
    setEnergieAnimee(energie)
    const t = setTimeout(() => setEnergieAnimee(resultat.nouvelleEnergie), 300)
    return () => clearTimeout(t)
  }, [resultat]) // eslint-disable-line

  useEffect(() => {
    function onVideoJouer() {
      videoRef.current?.play().catch(() => {})
      setVideoJamaisLancee(false)
    }
    function onVideoPause() {
      videoRef.current?.pause()
    }
    function onVideoSeek({ temps }) {
      const v = videoRef.current
      if (v) v.currentTime = temps
    }
    function onAfficherChoix() {
      activerModeChoix()
    }

    function naviguerVersSuivant(consequence, nextId, nouvelleEnergie, texteChoix = '') {
      // Guard absolu : ne jamais naviguer tant qu'une vidéo de conséquence tourne.
      // La navigation pour les conséquences vidéo est déclenchée exclusivement
      // par surFinVideo() après l'événement onEnded.
      if (enPhaseConsequenceRef.current) return

      const nav  = navigateRef.current
      const c    = codeRef.current
      const n    = nomRef.current
      const h    = isHoteRef.current
      const idx  = sequenceIdxRef.current
      // nextId est un ID de séquence → conversion en index tableau
      const next = nextId !== undefined ? idVersIndex(nextId) : idx + 1
      const p    = permutationRef.current
      const pk   = partieKeyRef.current
      const ne   = nomEquipeRef.current

      if (consequence === 'fin-prematuree') {
        nav('/resultats', { state: { code: c, nom: n, isHote: h, energie: nouvelleEnergie, finType: 'echec', permutation: p, nomEquipe: ne } })
      } else if (consequence === 'fin-jeu' || next >= SEQUENCES.length) {
        nav('/resultats', { state: { code: c, nom: n, isHote: h, energie: nouvelleEnergie, finType: calculerFin(nouvelleEnergie), permutation: p, nomEquipe: ne } })
      } else {
        nav('/video', { state: { code: c, nom: n, isHote: h, sequenceIndex: next, energie: nouvelleEnergie, permutation: p, texteChoixPrecedent: texteChoix, partieKey: pk, nomEquipe: ne } })
      }
    }

    function onAllerConsequence({ couleur, energie: nouvelleEnergie, consequence, nextSequence }) {
      setTimeout(() => {
        const seqId    = sequenceRef.current?.id
        const seqData  = sequencesData[seqId]
        const consData = seqData?.consequences?.[couleur]
        const texte    = consData?.texte        || ''
        const type     = consData?.type         || 'succes'
        const delta    = consData?.energieDelta ?? 0

        setResultat({ couleur, texte, type, delta, nouvelleEnergie, consequence, nextSequence })

        // Quiz/erreurs : transition automatique maintenue (pas de bouton Continuer pour ces cas)
        if (consequence === 'quiz-echec') {
          setTimeout(() => {
            setResultat(null)
            naviguerVersSuivant('continuer', /* id */ 1, nouvelleEnergie)
          }, 2500)
          return
        }

        if (consequence === 'retour-debriefing') {
          setTimeout(() => {
            setResultat(null)
            naviguerVersSuivant('continuer', /* id */ 1, 100)
          }, 2500)
          return
        }

        // Cas normaux : stocker les données et attendre le clic "Continuer" de la Manette.
        pendingNavigationRef.current = { consequence, nextSequence, nouvelleEnergie, texte }

        // Stocker le chemin de la vidéo de conséquence — la lecture sera déclenchée
        // manuellement par la Manette (bouton Play) après que le joueur clique "Continuer".
        const videoApres = sequenceRef.current?.choix?.[couleur]?.videoConsequence
        if (videoApres) {
          consequenceVideoPlayFnRef.current = videoApres
        }
        // Sans vidéo : l'overlay résultat reste visible jusqu'à continuer-sequence.
      }, 1500)
    }

    // La Manette envoie 'continuer-sequence' quand le joueur clique sur le bouton "Continuer".
    function onContinuerSequence() {
      const data = pendingNavigationRef.current
      if (!data) return

      // Cas 1 : la vidéo de conséquence est déjà en cours de lecture — attendre la fin.
      // surFinVideo() naviguera dès qu'elle se terminera.
      if (enPhaseConsequenceRef.current) {
        continuerClickedRef.current = true
        return
      }

      // Cas 2 : une vidéo de conséquence est stockée — la charger en pause et signaler
      // à la Manette qu'elle peut appuyer sur Play pour lancer la lecture.
      const videoPath = consequenceVideoPlayFnRef.current
      if (videoPath) {
        const v = videoRef.current
        if (!v) return
        setResultat(null)
        setAfficherChoix(false)
        setVideoJamaisLancee(true)          // affiche "En attente de lecture" sur la Console
        enPhaseConsequenceRef.current = true
        continuerClickedRef.current   = true
        v.loop = false
        v.muted = false
        v.playbackRate = 1
        v.src = videoPath
        consequenceVideoPlayFnRef.current = null
        // Déverrouille le bouton Play sur la Manette (même signal que la fin du titre).
        socket.emit('titre-fini', codeRef.current)
        return
      }

      // Cas 3 : aucune vidéo de conséquence — naviguer immédiatement.
      pendingNavigationRef.current  = null
      enPhaseConsequenceRef.current = false
      continuerClickedRef.current   = false
      setResultat(null)

      const nav  = navigateRef.current
      const c    = codeRef.current
      const n    = nomRef.current
      const h    = isHoteRef.current
      const p    = permutationRef.current
      const pk   = partieKeyRef.current
      const ne   = nomEquipeRef.current
      const idx  = sequenceIdxRef.current
      const { consequence, nextSequence, nouvelleEnergie, texte } = data
      // nextSequence est un ID → convertir en index
      const next = nextSequence !== undefined ? idVersIndex(nextSequence) : idx + 1

      if (consequence === 'fin-prematuree') {
        nav('/resultats', { state: { code: c, nom: n, isHote: h, energie: nouvelleEnergie, finType: 'echec', permutation: p, nomEquipe: ne } })
      } else if (consequence === 'fin-jeu' || next >= SEQUENCES.length) {
        nav('/resultats', { state: { code: c, nom: n, isHote: h, energie: nouvelleEnergie, finType: calculerFin(nouvelleEnergie), permutation: p, nomEquipe: ne } })
      } else {
        socket.emit('sequence-change', { code: c, next })
        nav('/video', { state: { code: c, nom: n, isHote: h, sequenceIndex: next, energie: nouvelleEnergie, permutation: p, texteChoixPrecedent: texte, partieKey: pk, nomEquipe: ne } })
      }
    }

    // La Manette a validé l'inventaire → navigation directe vers la séquence suivante
    // (pas de phase de vote : tous les choix de l'inventaire mènent au même nextSequence).
    function onValiderInventaire() {
      const v   = videoRef.current
      const seq = sequenceRef.current
      const idx = sequenceIdxRef.current
      const nav = navigateRef.current
      const c   = codeRef.current
      const n   = nomRef.current
      const h   = isHoteRef.current
      const p   = permutationRef.current
      const pk  = partieKeyRef.current
      const e   = energieRef.current

      // Stopper proprement la vidéo (arrêt de replay éventuel)
      if (v) {
        v.loop         = false
        v.playbackRate = 1
        v.pause()
      }
      setPhaseItems(false)

      // La prochaine séquence est portée par les choix de l'inventaire
      // (tous pointent vers le même nextSequence ID : Le Voile du Nord).
      const premiereConsequence = Object.values(seq?.choix ?? {})[0]
      const nextId = premiereConsequence?.nextSequence
      const next   = nextId !== undefined ? idVersIndex(nextId) : idx + 1

      socket.emit('sequence-change', { code: c, next })
      nav('/video', {
        state: {
          code:                c,
          nom:                 n,
          isHote:              h,
          sequenceIndex:       next,
          energie:             e,
          permutation:         p,
          partieKey:           pk,
          nomEquipe:           nomEquipeRef.current,
          texteChoixPrecedent: '',
        },
      })
    }

    // La Manette demande de rejouer l'inventaire depuis le début
    function onRejouerVideo() {
      setPhaseItems(false)
      sousTitresMontresRef.current = new Set()
      const v = videoRef.current
      if (!v) return
      v.currentTime = 0
      v.loop        = false
      v.muted       = false
      v.playbackRate = 1
      v.play().catch(() => {})
    }

    // La Manette passe (skip) la vidéo en cours
    function onPasserVideo() {
      const v = videoRef.current
      if (!v) return
      // Vidéo de conséquence en cours : la passer déclenche la navigation immédiate
      // (continuerClickedRef est déjà true depuis le démarrage de la conséquence).
      if (enPhaseConsequenceRef.current) {
        v.pause()
        surFinVideoRef.current?.()
        return
      }
      if (afficherChoixRef.current || phaseItemsRef.current) return
      const seq = sequenceRef.current
      if (seq?.type === 'quiz' || seq?.type === 'quiz-connaissance') return
      v.pause() // empêche onEnded de se déclencher en double
      surFinVideoRef.current?.()
    }

    socket.on('video-jouer',        onVideoJouer)
    socket.on('video-pause',        onVideoPause)
    socket.on('video-seek',         onVideoSeek)
    socket.on('afficher-choix',     onAfficherChoix)
    socket.on('aller-consequence',  onAllerConsequence)
    socket.on('continuer-sequence', onContinuerSequence)
    socket.on('valider-inventaire', onValiderInventaire)
    socket.on('rejouer-video',      onRejouerVideo)
    socket.on('passer-video',       onPasserVideo)

    return () => {
      socket.off('video-jouer',        onVideoJouer)
      socket.off('video-pause',        onVideoPause)
      socket.off('video-seek',         onVideoSeek)
      socket.off('afficher-choix',     onAfficherChoix)
      socket.off('aller-consequence',  onAllerConsequence)
      socket.off('continuer-sequence', onContinuerSequence)
      socket.off('valider-inventaire', onValiderInventaire)
      socket.off('rejouer-video',      onRejouerVideo)
      socket.off('passer-video',       onPasserVideo)
    }
  }, []) // eslint-disable-line

  useEffect(() => {
    function onSessionTerminee() { window.location.replace('/') }
    function onRedemarrer() {
      // Nettoyer tout état en suspens avant de naviguer, pour éviter
      // qu'un timer ou une vidéo de conséquence en cours interfère.
      clearTimeout(consequenceVideoTimerRef.current)
      clearTimeout(sousTitreTimerRef.current)
      consequenceVideoTimerRef.current  = null
      consequenceVideoPlayFnRef.current = null
      pendingNavigationRef.current      = null
      enPhaseConsequenceRef.current     = false
      continuerClickedRef.current       = false

      // Un nouveau partieKey force App.jsx à démonter/remonter <Video />
      // entièrement : état React, refs, listeners socket et élément <video>
      // repartent tous de zéro, quelle que soit la séquence courante.
      navigateRef.current('/video', {
        state: {
          code:          codeRef.current,
          nom:           nomRef.current,
          isHote:        isHoteRef.current,
          sequenceIndex: 0,
          energie:       100,
          permutation:   permutationRef.current,
          partieKey:     Date.now(),
          nomEquipe:     nomEquipeRef.current,
        },
      })
    }
    socket.on('session-terminee', onSessionTerminee)
    socket.on('redemarrer',       onRedemarrer)
    return () => {
      socket.off('session-terminee', onSessionTerminee)
      socket.off('redemarrer',       onRedemarrer)
    }
  }, [])

  function activerModeChoix() {
    const video = videoRef.current
    if (!video) return
    video.loop = true
    video.muted = true
    video.playbackRate = 0.18
    video.play().catch(() => {})
    setAfficherChoix(true)
  }

  function surProgression() {
    const v = videoRef.current
    if (!v?.duration) return
    setProgression(v.currentTime / v.duration)

    const st = sequence?.sousTitres
    if (st && !afficherChoix) {
      const t = v.currentTime
      st.forEach((item, i) => {
        if (t >= item.temps && !sousTitresMontresRef.current.has(i)) {
          sousTitresMontresRef.current.add(i)
          setSousTitreActuel(item)
          clearTimeout(sousTitreTimerRef.current)
          sousTitreTimerRef.current = setTimeout(() => setSousTitreActuel(null), 3200)
        }
      })
    }
  }

  function surChargement() { setDuree(videoRef.current?.duration || 0) }

  function surFinVideo() {
    if (enPhaseConsequenceRef.current) {
      enPhaseConsequenceRef.current = false
      // Si "Continuer" avait déjà été cliqué pendant la vidéo, naviguer maintenant
      if (continuerClickedRef.current) {
        continuerClickedRef.current = false
        const data = pendingNavigationRef.current
        if (data) {
          pendingNavigationRef.current = null
          setResultat(null)
          const nav  = navigateRef.current
          const c    = codeRef.current
          const n    = nomRef.current
          const h    = isHoteRef.current
          const p    = permutationRef.current
          const pk   = partieKeyRef.current
          const idx  = sequenceIdxRef.current
          const { consequence, nextSequence, nouvelleEnergie, texte } = data
          // nextSequence est un ID → convertir en index
          // Cette navigation est garantie post-onEnded (enPhaseConsequenceRef venait d'être true).
          const next = nextSequence !== undefined ? idVersIndex(nextSequence) : idx + 1
          const ne2 = nomEquipeRef.current
          if (consequence === 'fin-prematuree') {
            nav('/resultats', { state: { code: c, nom: n, isHote: h, energie: nouvelleEnergie, finType: 'echec', permutation: p, nomEquipe: ne2 } })
          } else if (consequence === 'fin-jeu' || next >= SEQUENCES.length) {
            nav('/resultats', { state: { code: c, nom: n, isHote: h, energie: nouvelleEnergie, finType: calculerFin(nouvelleEnergie), permutation: p, nomEquipe: ne2 } })
          } else {
            socket.emit('sequence-change', { code: c, next })
            nav('/video', { state: { code: c, nom: n, isHote: h, sequenceIndex: next, energie: nouvelleEnergie, permutation: p, texteChoixPrecedent: texte, partieKey: pk, nomEquipe: ne2 } })
          }
        }
      }
      return
    }
    if (sequence?.sousTitres?.length) {
      // Inventaire : afficher les items et notifier immédiatement la Manette.
      // Ne pas attendre la fin de l'animation (l'ancien délai de 4700 ms laissait
      // le bouton Play visible, provoquant des redémarrages involontaires de la vidéo).
      setPhaseItems(true)
      socket.emit('inventaire-pret', codeRef.current)
    } else {
      // Vidéo standard : prompt "choisissez" puis mode choix
      setAfficherPromptChoix(true)
      socket.emit('video-fin', codeRef.current)
      setTimeout(() => {
        setAfficherPromptChoix(false)
        activerModeChoix()
      }, 2500)
    }
  }

  function formaterTemps(sec) {
    if (!sec || isNaN(sec)) return '0:00'
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  if (!sequence) return null

  function niveauEnergie() {
    const e = resultat?.nouvelleEnergie ?? energie
    if (e >= 80) return 'energie-100'
    if (e >= 50) return 'energie-80'
    if (e >= 30) return 'energie-50'
    if (e >= 10) return 'energie-30'
    return 'energie-10'
  }

  function hexChoix(choixId) {
    const idx = COULEURS.findIndex(c => c.id === choixId)
    const displayId = permutation[idx] ?? choixId
    return COULEURS.find(c => c.id === displayId)?.hex ?? '#fff'
  }

  // Mise à jour du ref à chaque render pour que les handlers socket lisent toujours la version actuelle
  surFinVideoRef.current = surFinVideo

  const tempsActuel = videoRef.current?.currentTime || 0
  const isQuizConn  = sequence.type === 'quiz-connaissance'

  return (
    <div className={`video-page mode-diffusion ${niveauEnergie()}`}>
      <div className="video-wrapper">

        {/* Indicateur Console : vidéo prête mais pas encore lancée */}
        <AnimatePresence>
          {videoJamaisLancee && !phaseTitre && !phaseChoixPrecedent && !afficherChoix && !resultat && !phaseItems && (
            <motion.div
              className="alerte-video-prete"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.5 } }}
              exit={{ opacity: 0, transition: { duration: 0.4 } }}
            >
              En attente de lecture — appuyez sur ▶ sur la Manette
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prompt Console : "choisissez" après la fin d'une vidéo */}
        <AnimatePresence>
          {afficherPromptChoix && (
            <motion.div
              className="prompt-choix-overlay"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
            >
              <motion.p
                className="prompt-choix-label"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.35, delay: 0.15 } }}
              >
                C'est à vous de jouer
              </motion.p>
              <motion.p
                className="prompt-choix-texte"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.3 } }}
              >
                Effectuez votre choix sur la Manette
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rappel narratif du choix précédent — s'affiche 5 s au début de chaque nouvelle séquence */}
        <AnimatePresence>
          {phaseChoixPrecedent && (
            <motion.div
              className="recap-choix-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.7 } }}
              exit={{ opacity: 0, transition: { duration: 1.0 } }}
            >
              <motion.p
                className="recap-choix-label"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.3 } }}
              >
                Rappel — votre décision
              </motion.p>
              <motion.p
                className="recap-choix-texte"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] } }}
              >
                {texteChoixPrecedent}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Titre typewriter — joue par-dessus la vidéo en cours */}
        <AnimatePresence>
          {phaseTitre && (
            <motion.div
              className="titre-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.5 } }}
              exit={{ opacity: 0, transition: { duration: 0.4 } }}
            >
              <motion.p
                className="titre-chapitre"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] } }}
              >
                {titreTexte}<span className="titre-curseur">|</span>
              </motion.p>
              <motion.p
                className="titre-lire-video"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.5, delay: 1.4 } }}
              >
                Lire la vidéo
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="energie-vignette" />

        {/* Sous-titres éléments pendant vidéo tutoriel */}
        <AnimatePresence>
          {sousTitreActuel && !afficherChoix && !phaseItems && (
            <motion.div
              key={sousTitreActuel.texte}
              className="sous-titre"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.35 } }}
              exit={{ opacity: 0, y: -6, transition: { duration: 0.4 } }}
            >
              {sousTitreActuel.texte}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase items — liste équipement après tutoriel vidéo */}
        <AnimatePresence>
          {phaseItems && sequence.sousTitres && (
            <motion.div
              className="phase-items"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.5 } }}
              exit={{ opacity: 0, transition: { duration: 0.4 } }}
            >
              <motion.p
                className="items-titre"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.2 } }}
              >
                Équipement disponible
              </motion.p>
              <div className="items-liste">
                {sequence.sousTitres.map((item, i) => (
                  <motion.p
                    key={item.texte}
                    className="items-element"
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0, transition: { duration: 0.4, delay: 0.4 + i * 0.45 } }}
                  >
                    — {item.texte}
                  </motion.p>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quiz-connaissance : question affichée sur la Console */}
        <AnimatePresence>
          {isQuizConn && afficherChoix && (
            <motion.div
              className="quiz-question-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.5 } }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
            >
              <motion.p
                className="quiz-question-label"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.15 } }}
              >
                Question
              </motion.p>
              <motion.p
                className="quiz-question-texte"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.25 } }}
              >
                {sequence.question}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* La description de scène n'est montrée qu'au tout début (séquence 0) pour ne pas surcharger l'écran */}
        <SceneDescription
          text={sequencesData[sequence?.id]?.description}
          visible={!!sequencesData[sequence?.id]?.description && afficherChoix && !resultat && !isQuizConn && sequenceIndex === 0}
        />

        {sequence.type === 'quiz' && sequence.image && (
          <img
            src={sequence.image}
            alt=""
            className={`quiz-fond ${afficherChoix ? 'quiz-fond-attenuation' : ''}`}
          />
        )}

        <video
          key={sequenceIndex}
          ref={videoRef}
          className={`video-lecteur ${afficherChoix ? 'video-attenuation' : ''} ${(sequence.type === 'quiz' || isQuizConn) ? 'video-cachee' : ''}`}
          src={sequence.video}
          onTimeUpdate={surProgression}
          onLoadedMetadata={surChargement}
          onEnded={surFinVideo}
          playsInline
        />

        <div className="video-sequence-label">
          <div className="seq-barre-fond">
            <div
              className="seq-barre-fill"
              style={{ width: `${(sequenceIndex + 1) / SEQUENCES.length * 100}%` }}
            />
          </div>
          <span className="seq-label-texte">{sequenceIndex + 1} / {SEQUENCES.length} — {sequence.titre}</span>
        </div>

        <AnimatePresence>
          {resultat && (
            <motion.div
              className={`resultat-overlay resultat-${resultat.type}`}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
            >
              <motion.div
                className="resultat-badge"
                style={{ background: hexChoix(resultat.couleur) }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 320, damping: 20, delay: 0.1 } }}
              >
                {sequencesData[sequence?.id]?.choix?.[resultat.couleur] || resultat.couleur.toUpperCase()}
              </motion.div>
              <motion.p
                className="resultat-texte"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] } }}
              >
                {resultat.texte}
              </motion.p>
              <motion.div
                className="resultat-jauge-wrap"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.32, ease: [0.22, 1, 0.36, 1] } }}
              >
                <JaugeEnergie valeur={energieAnimee} segments={10} taille="lg" label />
              </motion.div>
              {(resultat.consequence === 'quiz-echec' || resultat.consequence === 'retour-debriefing') ? (
                <p className="diffusion-suite">Retour au débriefing…</p>
              ) : (
                <p className="diffusion-suite">Prochaine séquence…</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {!afficherChoix && (
        <div className="video-bas">
          <div className="video-info gauche">
            <span className="info-point bleu" />
            <span className="info-texte">{nom || 'Diffusion'}</span>
          </div>
          <div className="video-controles">
            <span className="video-temps">{formaterTemps(tempsActuel)}</span>
            <div className="video-barre-fond">
              <div className="video-barre-remplie" style={{ width: progression * 100 + '%' }} />
              <div className="video-curseur" style={{ left: progression * 100 + '%' }} />
            </div>
            <span className="video-temps">{formaterTemps(duree)}</span>
          </div>
          <div className="video-info droite">
            <span className="info-texte">Diffusion</span>
            <span className="info-point vert" />
          </div>
        </div>
      )}
    </div>
  )
}

export default Video
