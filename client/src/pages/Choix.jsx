import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import socket from '../socket'
import { SEQUENCES, calculerFin } from '../scenario'
import useAudio from '../hooks/useAudio'
import JaugeEnergie from '../components/JaugeEnergie'
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
  const audio      = useAudio()

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

  const [afficherChoix,       setAfficherChoix]       = useState(false)
  const [voteFait,            setVoteFait]            = useState(null)
  const [couleurGagnante,     setCouleurGagnante]     = useState(null)
  const [tempsRestant,        setTempsRestant]        = useState(DUREE_TIMER)
  const [nbVotes,             setNbVotes]             = useState(0)
  const [nbJoueurs,           setNbJoueurs]           = useState(1)
  const [videoEnLecture,      setVideoEnLecture]      = useState(false)
  const [afficherConfirmQuit, setAfficherConfirmQuit] = useState(false)

  const resultSoumisRef = useRef(false)
  const timerRef        = useRef(null)
  const timerLoopRef    = useRef(null)
  const voteFaitRef     = useRef(null)
  const audioRef        = useRef(audio)

  useEffect(() => {
    if (!code || !sequence) navigate('/', { replace: true })
  }, []) // eslint-disable-line

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
      if (timerLoopRef.current) { timerLoopRef.current.pause(); timerLoopRef.current = null }
      setCouleurGagnante(couleur)
      setEnergie(nouvelleEnergie)

      const energieDelta = SEQUENCES[seqIdxRef.current]?.choix[couleur]?.energie ?? 0
      if (consequence === 'fin-prematuree' || energieDelta < 0) {
        audioRef.current.mauvaisChoix()
      } else {
        audioRef.current.bonChoix()
      }

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
    let restant = DUREE_TIMER
    setTempsRestant(restant)
    timerRef.current = setInterval(() => {
      restant -= 1
      setTempsRestant(restant)
      if (restant === 5) {
        timerLoopRef.current = audioRef.current.timerBoucle()
      }
      if (restant <= 0) {
        clearInterval(timerRef.current)
        if (timerLoopRef.current) { timerLoopRef.current.pause(); timerLoopRef.current = null }
        audioRef.current.tempsFini()
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

  function quitterSession() {
    socket.emit('quitter-session', { code: codeRef.current })
    window.location.replace('/')
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
        <div className="choix-entete-centre">
          <div className="choix-seq-prog">
            <div className="choix-seq-prog-fond">
              <div className="choix-seq-prog-fill" style={{ width: `${(seqIdx + 1) / SEQUENCES.length * 100}%` }} />
            </div>
            <span className="choix-seq-num">{seqIdx + 1}/{SEQUENCES.length}</span>
          </div>
          <JaugeEnergie valeur={energie} segments={10} taille="sm" />
        </div>
        <button className="btn-quitter" onClick={() => setAfficherConfirmQuit(true)} aria-label="Quitter la partie">
          <img src="/assets/icons/quitter.png" alt="" className="btn-quitter-icone" />
        </button>
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
          <JaugeEnergie valeur={energie} segments={10} taille="md" label />
          <p className="resultat-suite">Prochaine séquence…</p>
        </div>
      )}

      {afficherConfirmQuit && (
        <div className="popup-overlay" onClick={() => setAfficherConfirmQuit(false)}>
          <div className="popup-boite" onClick={e => e.stopPropagation()}>
            <p className="popup-titre">QUITTER LA PARTIE ?</p>
            <p className="popup-texte">La session sera détruite pour tous les joueurs.</p>
            <div className="popup-actions">
              <button className="popup-btn popup-annuler" onClick={() => setAfficherConfirmQuit(false)}>
                Continuer
              </button>
              <button className="popup-btn popup-confirmer" onClick={quitterSession}>
                Quitter
              </button>
            </div>
          </div>
        </div>
      )}

      {!couleurGagnante && !afficherChoix && (
        <div className="choix-attente">

          {isHote && (
            <button className="hote-play-btn" onClick={toggleVideo}>
              <img
                className="hote-play-icone"
                src="/assets/icons/play-button.png"
                alt=""
                style={{ opacity: videoEnLecture ? 0.45 : 1 }}
              />
              <span className="hote-play-label">
                {videoEnLecture ? 'Pause' : 'Lancer la vidéo'}
              </span>
            </button>
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
        </div>
      )}

      {!couleurGagnante && afficherChoix && (
        <div className="choix-vote">

          <p className="vote-invite">CHOISISSEZ !</p>

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
            {actifs.map((c, i) => (
              <button
                key={c.id}
                className={`vote-btn
                  ${voteFait === c.id              ? 'vote-selectionne' : ''}
                  ${voteFait && voteFait !== c.id   ? 'vote-estompe'     : ''}
                  ${!voteFait && tempsRestant <= 5  ? 'vote-urgence'     : ''}`}
                style={{ '--couleur': c.hex, '--i': i }}
                onClick={() => voter(c.id)}
                disabled={!!voteFait}
              >
                <span className="vote-btn-label">
                  {sequence.choix[c.id]?.label || c.label}
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
