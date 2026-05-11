import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import socket from '../socket'
import './Accueil.css'

const SALLE_CODE  = 'SALLE'
const NOM_MANETTE = 'Manette'
const NOM_CONSOLE = 'Console'

const ease = [0.22, 1, 0.36, 1]

const varContenu = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
}
const varItem = {
  hidden:  { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.48, ease } },
}
const varSection = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.36, ease } },
  exit:    { opacity: 0, y: -12, transition: { duration: 0.2 } },
}

const SYNOPSIS_PARAS = [
  { texte: "Dans les profondeurs glacées des forêts du Nord, le silence est rompu par une disparition inquiétante. Une randonneuse s'est évanouie dans le vertige des bois, et le temps joue contre elle.", mots: ["forêts du Nord", "temps joue contre elle"] },
  { texte: "Jake Carter, garde forestier stagiaire, est votre seul lien avec l'inconnu. À travers le brouillard épais, les ravins abrupts et les rencontres imprévues, ses sens dépendent de vos ordres.", mots: ["Jake Carter", "vos ordres"] },
  { texte: "L'aventure commence là où les sentiers s'arrêtent. Sa survie est entre vos mains.", mots: ["Sa survie est entre vos mains"] },
]

function SynopsisPara({ texte, mots }) {
  const segments = []
  let reste = texte
  mots.forEach(mot => {
    const idx = reste.indexOf(mot)
    if (idx === -1) return
    if (idx > 0) segments.push({ type: 'normal', val: reste.slice(0, idx) })
    segments.push({ type: 'accent', val: mot })
    reste = reste.slice(idx + mot.length)
  })
  if (reste) segments.push({ type: 'normal', val: reste })
  if (!segments.length) return <>{texte}</>
  return (
    <>
      {segments.map((s, i) =>
        s.type === 'accent'
          ? <span key={i} className="synopsis-mot-cle">{s.val}</span>
          : <span key={i}>{s.val}</span>
      )}
    </>
  )
}

// Détection : Manette = appareil tactile, Console = PC/TV
const isManette = navigator.maxTouchPoints > 0

function Accueil() {
  const navigate      = useNavigate()
  const pendingNavRef = useRef(null)

  const [etape,           setEtape]           = useState('attente') // 'attente' | 'synopsis' | 'nom-equipe'
  const [titreTexte,      setTitreTexte]      = useState('')
  const [boutonVisible,   setBoutonVisible]   = useState(false)
  const [paraVisible,     setParaVisible]     = useState(0) // nb de paragraphes révélés
  const [nomEquipeInput,  setNomEquipeInput]  = useState('')

  // Révélation séquentielle des paragraphes + typewriter du titre
  useEffect(() => {
    if (etape !== 'synopsis') return
    setBoutonVisible(false)
    setTitreTexte('')
    setParaVisible(0)

    // Délai entre chaque paragraphe
    const DELAI_PARA = 1200
    const paraTimers = SYNOPSIS_PARAS.map((_, i) =>
      setTimeout(() => setParaVisible(i + 1), 400 + i * DELAI_PARA)
    )

    // Typewriter démarré après que tous les paragraphes sont apparus
    const debutTypewriter = 400 + SYNOPSIS_PARAS.length * DELAI_PARA + 600
    const titre = 'OPÉRATION JACK CARTER'
    let writeTimer = null
    let pauseTimer = null
    let eraseTimer = null

    const startTypewriter = setTimeout(() => {
      let i = 0
      writeTimer = setInterval(() => {
        i++
        setTitreTexte(titre.slice(0, i))
        if (i >= titre.length) {
          clearInterval(writeTimer)
          pauseTimer = setTimeout(() => {
            let j = titre.length
            eraseTimer = setInterval(() => {
              j--
              setTitreTexte(titre.slice(0, j))
              if (j <= 0) {
                clearInterval(eraseTimer)
                setBoutonVisible(true)
              }
            }, 35)
          }, 1500)
        }
      }, 55)
    }, debutTypewriter)

    return () => {
      paraTimers.forEach(clearTimeout)
      clearTimeout(startTypewriter)
      if (writeTimer) clearInterval(writeTimer)
      clearTimeout(pauseTimer)
      if (eraseTimer) clearInterval(eraseTimer)
    }
  }, [etape])

  // Wake Lock — empêche la mise en veille de la tablette sur l'écran d'attente
  useEffect(() => {
    if (!isManette) return
    let wakeLock = null
    async function acquerir() {
      if (!('wakeLock' in navigator)) return
      try {
        wakeLock = await navigator.wakeLock.request('screen')
        wakeLock.addEventListener('release', () => {
          if (document.visibilityState === 'visible') acquerir()
        })
      } catch (_) {}
    }
    async function onVisibilite() {
      if (document.visibilityState === 'visible') await acquerir()
    }
    acquerir()
    document.addEventListener('visibilitychange', onVisibilite)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilite)
      wakeLock?.release()
    }
  }, [])

  useEffect(() => {
    // Console : rejoindre la salle automatiquement sans action de l'utilisateur
    function rejoindreConsole() {
      if (!isManette) socket.emit('rejoindre-console')
    }
    rejoindreConsole()
    socket.on('connect', rejoindreConsole)

    // Les deux appareils reçoivent session-lancee quand la Manette prend le contrôle
    function onSessionLancee({ permutationCouleurs }) {
      pendingNavRef.current = {
        code: SALLE_CODE,
        nom:  isManette ? NOM_MANETTE : NOM_CONSOLE,
        permutationCouleurs,
      }
      setEtape('synopsis')
    }

    // Les deux appareils reçoivent mission-lancee quand le nom d'équipe est confirmé
    function onMissionLancee({ nomEquipe = '' } = {}) {
      const nav = pendingNavRef.current
      if (!nav) return
      const state = {
        code:          nav.code,
        nom:           nav.nom,
        isHote:        true,
        sequenceIndex: 0,
        energie:       100,
        permutation:   nav.permutationCouleurs,
        nomEquipe:     nomEquipe || '',
      }
      navigate(isManette ? '/choix' : '/video', { state })
    }

    socket.on('session-lancee', onSessionLancee)
    socket.on('mission-lancee', onMissionLancee)

    return () => {
      socket.off('connect',        rejoindreConsole)
      socket.off('session-lancee', onSessionLancee)
      socket.off('mission-lancee', onMissionLancee)
    }
  }, [navigate])

  function prendreControle() {
    socket.emit('prendre-controle')
  }

  function lancerMission() {
    if (!pendingNavRef.current) return
    setEtape('nom-equipe')
  }

  function confirmerNom() {
    const nom = nomEquipeInput.trim() || 'Équipe'
    socket.emit('lancer-mission', { code: SALLE_CODE, nomEquipe: nom })
  }

  function passerNom() {
    socket.emit('lancer-mission', { code: SALLE_CODE, nomEquipe: '' })
  }

  return (
    <div className="accueil">
      <div className="brume brume-bas" />
      <div className="brume brume-haut" />

      <motion.div
        className="accueil-contenu"
        variants={varContenu}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="ligne-deco" variants={varItem}>
          <span>Enquête interactive</span>
        </motion.div>

        <motion.h1 className="accueil-titre" variants={varItem}>
          JACK<br />
          <span className="accent">CARTER</span>
        </motion.h1>

        <motion.p className="accueil-sous-titre" variants={varItem}>
          La nuit est tombée. Quelqu'un sait ce qui s'est passé.
        </motion.p>

        <AnimatePresence mode="wait">

          {etape === 'attente' && (
            <motion.div
              key="attente"
              className="accueil-attente-zone"
              variants={varSection}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {isManette ? (
                /* Manette : un seul bouton pour rejoindre et devenir hôte */
                <motion.button
                  className="btn-hote btn-prendre-controle"
                  onClick={prendreControle}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Prendre le contrôle
                </motion.button>
              ) : (
                /* Console : attente passive, aucune action requise */
                <>
                  <p className="attente-message">En attente de la Manette…</p>
                  <p className="attente-hint">Lance l'interface sur la tablette pour démarrer</p>
                </>
              )}
            </motion.div>
          )}

          {etape === 'synopsis' && (
            <motion.div
              key="synopsis"
              className="synopsis-ecran"
              variants={varSection}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Badge "DOSSIER CONFIDENTIEL" */}
              <motion.div
                className="synopsis-badge"
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1, transition: { duration: 0.4, ease } }}
              >
                ▌ Dossier confidentiel ▐
              </motion.div>

              {/* Paragraphes révélés un par un */}
              <div className="synopsis-paragraphes">
                {SYNOPSIS_PARAS.map((para, i) => (
                  <AnimatePresence key={i}>
                    {paraVisible > i && (
                      <motion.p
                        className="synopsis-para"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }}
                      >
                        <SynopsisPara texte={para.texte} mots={para.mots} />
                      </motion.p>
                    )}
                  </AnimatePresence>
                ))}
              </div>

              {/* Typewriter du titre — visible sur les deux appareils */}
              <AnimatePresence>
                {titreTexte && (
                  <motion.p
                    className="synopsis-titre-type"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 0.3 } }}
                  >
                    {titreTexte}
                    {!boutonVisible && <span className="titre-curseur">|</span>}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Bouton Manette : apparaît après la fin de l'animation */}
              <AnimatePresence>
                {boutonVisible && isManette && (
                  <motion.button
                    className="btn-lancer"
                    onClick={lancerMission}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Lancer la mission
                  </motion.button>
                )}
                {boutonVisible && !isManette && (
                  <motion.p
                    className="synopsis-attente-console"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 0.5 } }}
                  >
                    En attente — Lancer la mission depuis la Manette
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {etape === 'nom-equipe' && isManette && (
            <motion.div
              key="nom-equipe"
              className="nom-equipe-ecran"
              variants={varSection}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <motion.p
                className="nom-equipe-titre"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.05 } }}
              >
                Votre équipe
              </motion.p>
              <motion.p
                className="nom-equipe-sous"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.4, delay: 0.15 } }}
              >
                Donnez un nom à votre équipe pour le débriefing final
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.22 } }}
                style={{ width: '100%' }}
              >
                <input
                  className="nom-equipe-input"
                  type="text"
                  placeholder="Ex : Les Aventuriers"
                  maxLength={32}
                  value={nomEquipeInput}
                  onChange={e => setNomEquipeInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && confirmerNom()}
                  autoFocus
                />
              </motion.div>
              <motion.button
                className="btn-lancer"
                onClick={confirmerNom}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.32 } }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Confirmer
              </motion.button>
              <motion.button
                className="btn-passer-nom"
                onClick={passerNom}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.35, delay: 0.55 } }}
                whileTap={{ scale: 0.97 }}
              >
                Passer →
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>

        <motion.div className="ligne-deco" style={{ marginTop: 8 }} variants={varItem}>
          <span>Console + Manette</span>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Accueil
