// Manette interactive (tablette + téléphone).
// Tous les contrôleurs passent par cette page. Le PC/TV reste sur /video.
//
// Rôles :
//   Hôte (tablette) : contrôle play/pause + vote.
//   Joueur (téléphone/tablette) : vote uniquement.

import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import socket from '../socket'
import { SEQUENCES, calculerFin } from '../scenario'
import './Choix.css'

const DUREE_TIMER = 15

const COULEURS = [
  { id: 'rouge', label: 'ROUGE', hex: '#c0392b' },
  { id: 'vert',  label: 'VERT',  hex: '#27ae60' },
  { id: 'bleu',  label: 'BLEU',  hex: '#5b8dd9' },
  { id: 'jaune', label: 'JAUNE', hex: '#e6b800' },
]

function Choix() {
  const { state }  = useLocation()
  const navigate   = useNavigate()

  const { code, nom, isHote } = state || {}

  const [seqIdx,  setSeqIdx]  = useState(state?.sequenceIndex ?? 0)
  const [energie, setEnergie] = useState(state?.energie       ?? 100)

  const sequence = SEQUENCES[seqIdx]

  const codeRef       = useRef(code)
  const seqIdxRef     = useRef(seqIdx)
  const navigateRef   = useRef(navigate)
  const isHoteRef     = useRef(isHote)
  codeRef.current     = code
  seqIdxRef.current   = seqIdx
  navigateRef.current = navigate
  isHoteRef.current   = isHote

  const [afficherChoix,   setAfficherChoix]   = useState(false)
  const [voteFait,        setVoteFait]        = useState(null)
  const [couleurGagnante, setCouleurGagnante] = useState(null)
  const [tempsRestant,    setTempsRestant]    = useState(DUREE_TIMER)
  const [nbVotes,         setNbVotes]         = useState(0)
  const [nbJoueurs,       setNbJoueurs]       = useState(1)
  const [videoEnLecture,  setVideoEnLecture]  = useState(false)

  const resultSoumisRef = useRef(false)
  const timerRef        = useRef(null)
  const voteFaitRef     = useRef(null)

  useEffect(() => {
    if (!code || !sequence) navigate('/', { replace: true })
  }, []) // eslint-disable-line

  // Réinitialisation à chaque changement de séquence
  useEffect(() => {
    setAfficherChoix(false)
    setVoteFait(null)
    voteFaitRef.current = null
    setCouleurGagnante(null)
    setTempsRestant(DUREE_TIMER)
    resultSoumisRef.current = false
    setVideoEnLecture(false)

    if (sequence?.type === 'quiz') {
      const t = setTimeout(() => activerChoix(), 300)
      return () => clearTimeout(t)
    }
  }, [seqIdx]) // eslint-disable-line

  useEffect(() => {
    function onAfficherChoix() {
      activerChoix()
      setVideoEnLecture(false)
    }

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
      setCouleurGagnante(couleur)
      setEnergie(nouvelleEnergie)

      setTimeout(() => {
        if (consequence === 'fin-prematuree') {
          setSeqIdx(0)
          setEnergie(100)
          return
        }

        const next = nextSequence !== undefined ? nextSequence : seqIdxRef.current + 1

        if (consequence === 'fin-jeu' || next >= SEQUENCES.length) {
          navigateRef.current('/resultats', {
            state: {
              code:    codeRef.current,
              nom,
              isHote,
              energie: nouvelleEnergie,
              finType: calculerFin(nouvelleEnergie),
            }
          })
          return
        }

        setSeqIdx(next)
      }, 2500)
    }

    function onVideoJouer() { setVideoEnLecture(true)  }
    function onVideoPause() { setVideoEnLecture(false) }

    socket.on('afficher-choix',    onAfficherChoix)
    socket.on('vote-recu',         onVoteRecu)
    socket.on('aller-consequence', onAllerConsequence)
    socket.on('video-jouer',       onVideoJouer)
    socket.on('video-pause',       onVideoPause)

    return () => {
      socket.off('afficher-choix',    onAfficherChoix)
      socket.off('vote-recu',         onVoteRecu)
      socket.off('aller-consequence', onAllerConsequence)
      socket.off('video-jouer',       onVideoJouer)
      socket.off('video-pause',       onVideoPause)
      clearInterval(timerRef.current)
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
    let restant = DUREE_TIMER
    setTempsRestant(restant)
    timerRef.current = setInterval(() => {
      restant -= 1
      setTempsRestant(restant)
      if (restant <= 0) {
        clearInterval(timerRef.current)
        if (isHoteRef.current) soumettreResultat()
      }
    }, 1000)
  }

  function voter(couleurId) {
    if (voteFaitRef.current) return
    voteFaitRef.current = couleurId
    setVoteFait(couleurId)
    socket.emit('joueur-vote', { code: codeRef.current, couleur: couleurId })
  }

  function soumettreResultat() {
    if (resultSoumisRef.current) return
    resultSoumisRef.current = true
    socket.emit('calculer-vote', { code: codeRef.current, choix: SEQUENCES[seqIdxRef.current].choix })
  }

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

  const actifs       = COULEURS.filter(c => sequence.choix[c.id])
  const couleurTimer = tempsRestant > 10 ? '#CB592E' : tempsRestant > 5 ? '#e6b800' : '#c0392b'

  return (
    <div className="choix-page">

      <header className="choix-entete">
        <span className="choix-nom">{nom}</span>
        <span className="choix-seq">{seqIdx + 1} / {SEQUENCES.length}</span>
        <span className="choix-energie" style={{
          color: energie > 50 ? '#27ae60' : energie > 20 ? '#e6b800' : '#c0392b'
        }}>
          ⚡ {energie}%
        </span>
      </header>

      {couleurGagnante && (
        <div
          className="choix-resultat"
          style={{ color: COULEURS.find(c => c.id === couleurGagnante)?.hex }}
        >
          <p className="resultat-titre">Choix du groupe</p>
          <p className="resultat-couleur">
            {sequence.choix[couleurGagnante]?.label}
          </p>
          <p className="resultat-suite">Prochaine séquence…</p>
        </div>
      )}

      {!couleurGagnante && !afficherChoix && (
        <div className="choix-attente">

          {isHote && (
            <button className="hote-play-btn" onClick={toggleVideo}>
              <span className="hote-play-icone">
                {videoEnLecture ? '⏸' : '▶'}
              </span>
              <span className="hote-play-label">
                {videoEnLecture ? 'Pause' : 'Lancer la vidéo'}
              </span>
            </button>
          )}

          {!isHote && (
            <>
              <div className="attente-icone">▶</div>
              <p className="attente-titre">Regarde l'écran principal</p>
            </>
          )}

          <p className="attente-sous">{sequence.titre}</p>
        </div>
      )}

      {!couleurGagnante && afficherChoix && (
        <div className="choix-vote">

          <div className="vote-header">
            <div className="vote-cercle" style={{
              borderColor: couleurTimer,
              boxShadow: `0 0 20px ${couleurTimer}44`,
            }}>
              <span className="vote-timer">{tempsRestant}</span>
            </div>
            <span className="vote-compteur">{nbVotes} / {nbJoueurs} votes</span>
          </div>

          <div className={`vote-grille ${actifs.length === 2 ? 'vote-deux' : ''}`}>
            {actifs.map(c => (
              <button
                key={c.id}
                className={`vote-btn
                  ${voteFait === c.id                   ? 'vote-selectionne' : ''}
                  ${voteFait && voteFait !== c.id        ? 'vote-estompe'     : ''}`}
                style={{ '--couleur': c.hex }}
                onClick={() => voter(c.id)}
                disabled={!!voteFait}
              >
                <span className="vote-btn-label">
                  {sequence.choix[c.id].label}
                </span>
              </button>
            ))}
          </div>

          {voteFait && (
            <p className="vote-confirme">
              Vote envoyé — en attente des autres joueurs…
            </p>
          )}

        </div>
      )}

    </div>
  )
}

export default Choix
