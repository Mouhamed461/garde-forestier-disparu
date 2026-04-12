// Support de diffusion passif (PC / TV).
// Seuls les PC/TV atteignent cette page — tablettes et téléphones sont redirigés
// vers /choix dans App.jsx (RouteVideo).
//
// Comportement :
//  - Vidéo plein écran, lecture déclenchée par l'événement socket 'video-jouer'
//  - Aucune interaction directe — pointer-events: none sur toute la page
//  - 'aller-consequence' : affiche l'overlay puis navigue automatiquement

import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import socket from '../socket'
import { SEQUENCES, calculerFin } from '../scenario'
import sequencesData from '../data/sequences'
import SceneDescription from '../components/SceneDescription'
import './Video.css'

const DUREE_TIMER = 15

const COULEURS = [
  { id: 'rouge',  label: 'ROUGE',  hex: '#c0392b' },
  { id: 'vert',   label: 'VERT',   hex: '#27ae60' },
  { id: 'bleu',   label: 'BLEU',   hex: '#5b8dd9' },
  { id: 'jaune',  label: 'JAUNE',  hex: '#e6b800' },
]

function Video() {
  const { state } = useLocation()
  const navigate  = useNavigate()
  const { code, nom, isHote, sequenceIndex = 0, energie = 100 } = state || {}

  const sequence = SEQUENCES[sequenceIndex]

  const videoRef       = useRef(null)
  const timerRef       = useRef(null)
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
  const [tempsRestant,    setTempsRestant]     = useState(DUREE_TIMER)
  const [nbVotes,         setNbVotes]         = useState(0)
  const [nbJoueurs,       setNbJoueurs]       = useState(1)
  const [couleurGagnante, setCouleurGagnante] = useState(null)
  const [resultat,        setResultat]        = useState(null)

  useEffect(() => {
    if (!code || !sequence) navigate('/', { replace: true })
  }, []) // eslint-disable-line

  // Réinitialise l'UI à chaque nouvelle séquence (sans remonter le composant).
  useEffect(() => {
    setProgression(0)
    setDuree(0)
    setAfficherChoix(false)
    setTempsRestant(DUREE_TIMER)
    setNbVotes(0)
    setNbJoueurs(1)
    setCouleurGagnante(null)
    setResultat(null)
    clearInterval(timerRef.current)

    if (sequence?.type === 'quiz') {
      const t = setTimeout(() => activerModeChoix(), 300)
      return () => clearTimeout(t)
    }
  }, [sequenceIndex]) // eslint-disable-line

  useEffect(() => {
    function onVideoJouer() {
      const v = videoRef.current
      if (!v) return
      v.play().catch(() => {})
    }
    function onVideoPause() {
      const v = videoRef.current
      if (!v) return
      v.pause()
    }
    function onVideoSeek({ temps }) {
      const v = videoRef.current
      if (!v) return
      v.currentTime = temps
    }
    function onAfficherChoix() {
      activerModeChoix()
    }
    function onVoteRecu({ nbVotes: v, nbJoueurs: j }) {
      setNbVotes(v)
      setNbJoueurs(j)
    }
    function onAllerConsequence({ couleur, energie: nouvelleEnergie, consequence, nextSequence }) {
      clearInterval(timerRef.current)
      setCouleurGagnante(couleur)

      setTimeout(() => {
        const seqId    = sequenceRef.current?.id
        const seqData  = sequencesData[seqId]
        const consData = seqData?.consequences?.[couleur]
        const texte    = consData?.texte        || ''
        const type     = consData?.type         || 'succes'
        const delta    = consData?.energieDelta ?? 0

        setResultat({ couleur, texte, type, delta, nouvelleEnergie, consequence, nextSequence })

        // Navigation automatique après 3.5 s
        setTimeout(() => {
          const nav  = navigateRef.current
          const c    = codeRef.current
          const n    = nomRef.current
          const h    = isHoteRef.current
          const idx  = sequenceIdxRef.current
          const next = nextSequence !== undefined ? nextSequence : idx + 1

          if (consequence === 'fin-prematuree') {
            nav('/resultats', { state: { code: c, nom: n, isHote: h, energie: nouvelleEnergie, finType: 'echec' } })
          } else if (consequence === 'fin-jeu' || next >= SEQUENCES.length) {
            nav('/resultats', { state: { code: c, nom: n, isHote: h, energie: nouvelleEnergie, finType: calculerFin(nouvelleEnergie) } })
          } else {
            nav('/video', { state: { code: c, nom: n, isHote: h, sequenceIndex: next, energie: nouvelleEnergie } })
          }
        }, 3500)
      }, 1500)
    }

    socket.on('video-jouer',       onVideoJouer)
    socket.on('video-pause',       onVideoPause)
    socket.on('video-seek',        onVideoSeek)
    socket.on('afficher-choix',    onAfficherChoix)
    socket.on('vote-recu',         onVoteRecu)
    socket.on('aller-consequence', onAllerConsequence)

    return () => {
      socket.off('video-jouer',       onVideoJouer)
      socket.off('video-pause',       onVideoPause)
      socket.off('video-seek',        onVideoSeek)
      socket.off('afficher-choix',    onAfficherChoix)
      socket.off('vote-recu',         onVoteRecu)
      socket.off('aller-consequence', onAllerConsequence)
      clearInterval(timerRef.current)
    }
  }, []) // eslint-disable-line

  function activerModeChoix() {
    const video = videoRef.current
    if (!video) return
    video.loop = true
    video.playbackRate = 0.18
    video.play().catch(() => {})
    setAfficherChoix(true)
    demarrerTimer()
  }

  function demarrerTimer() {
    clearInterval(timerRef.current)
    let restant = DUREE_TIMER
    setTempsRestant(restant)
    timerRef.current = setInterval(() => {
      restant -= 1
      setTempsRestant(restant)
      if (restant <= 0) clearInterval(timerRef.current)
    }, 1000)
  }

  function surProgression() {
    const v = videoRef.current
    if (!v?.duration) return
    setProgression(v.currentTime / v.duration)
  }

  function surChargement() { setDuree(videoRef.current?.duration || 0) }

  function surFinVideo() {
    socket.emit('video-fin', codeRef.current)
    activerModeChoix()
  }

  function formaterTemps(sec) {
    if (!sec || isNaN(sec)) return '0:00'
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  if (!sequence) return null

  function niveauEnergie() {
    if (energie >= 80) return 'energie-100'
    if (energie >= 50) return 'energie-80'
    if (energie >= 30) return 'energie-50'
    if (energie >= 10) return 'energie-30'
    return 'energie-10'
  }

  const tempsActuel = videoRef.current?.currentTime || 0
  const actifs      = COULEURS.filter(c => sequence.choix[c.id])

  return (
    <div className={`video-page mode-diffusion ${niveauEnergie()}`}>
      <div className="video-wrapper">

        <video
          key={sequenceIndex}
          ref={videoRef}
          className={`video-lecteur ${afficherChoix ? 'video-attenuation' : ''} ${sequence.type === 'quiz' ? 'video-cachee' : ''}`}
          src={sequence.video}
          onTimeUpdate={surProgression}
          onLoadedMetadata={surChargement}
          onEnded={surFinVideo}
        />

        <div className="energie-vignette" />

        <SceneDescription
          text={sequencesData[sequence?.id]?.description}
          visible={afficherChoix && !resultat}
        />

        {sequence.type === 'quiz' && sequence.image && (
          <img
            src={sequence.image}
            alt=""
            className={`quiz-fond ${afficherChoix ? 'quiz-fond-attenuation' : ''}`}
          />
        )}

        <div className="video-sequence-label">
          {sequenceIndex + 1} / {SEQUENCES.length} — {sequence.titre}
        </div>

        <div className="video-energie">
          <span className="energie-label">ÉNERGIE</span>
          <div className="energie-barre-fond">
            <div className="energie-barre-remplie" style={{
              width: energie + '%',
              background: energie > 50 ? '#27ae60' : energie > 20 ? '#e6b800' : '#c0392b'
            }} />
          </div>
          <span className="energie-chiffre">{energie}%</span>
        </div>

        {resultat && (
          <div className={`resultat-overlay resultat-${resultat.type}`}>
            <div className="resultat-badge" style={{
              background: COULEURS.find(c => c.id === resultat.couleur)?.hex
            }}>
              {sequencesData[sequence?.id]?.choix?.[resultat.couleur] || resultat.couleur.toUpperCase()}
            </div>
            <p className="resultat-texte">{resultat.texte}</p>
            {resultat.type === 'malus' && resultat.delta !== 0 && (
              <p className="resultat-malus">ÉNERGIE {resultat.delta}%</p>
            )}
            <p className="diffusion-suite">Prochaine séquence…</p>
          </div>
        )}

        {afficherChoix && !resultat && (() => {
          const mi     = Math.ceil(actifs.length / 2)
          const gauche = actifs.slice(0, mi)
          const droite = actifs.slice(mi)
          return (
            <div className={`choix-overlay ${actifs.length === 2 ? 'choix-deux' : ''}`}>
              <div className="choix-colonne gauche">
                {gauche.map(c => (
                  <div
                    key={c.id}
                    className={`choix-rect ${couleurGagnante === c.id ? 'gagnant' : ''} ${couleurGagnante && couleurGagnante !== c.id ? 'estompe' : ''}`}
                    style={{ '--couleur': c.hex }}
                  >
                    <span className="choix-rect-label">{sequence.choix[c.id].label}</span>
                  </div>
                ))}
              </div>

              <div className="choix-centre">
                {sequence.type === 'quiz' && sequence.question && (
                  <p className="choix-question">{sequence.question}</p>
                )}
                <div className="choix-timer-cercle">
                  <span className="choix-timer-chiffre">{tempsRestant}</span>
                </div>
                <p className="votes-compteur">{nbVotes}/{nbJoueurs}</p>
                <div className="choix-timer-barre-fond">
                  <div className="choix-timer-barre-remplie"
                    style={{ width: (tempsRestant / DUREE_TIMER * 100) + '%' }} />
                </div>
              </div>

              <div className="choix-colonne droite">
                {droite.map(c => (
                  <div
                    key={c.id}
                    className={`choix-rect ${couleurGagnante === c.id ? 'gagnant' : ''} ${couleurGagnante && couleurGagnante !== c.id ? 'estompe' : ''}`}
                    style={{ '--couleur': c.hex }}
                  >
                    <span className="choix-rect-label">{sequence.choix[c.id].label}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

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
