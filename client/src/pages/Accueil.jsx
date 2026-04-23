import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import socket from '../socket'
import './Accueil.css'

function Accueil() {
  const containerRef = useRef(null)
  const navigate = useNavigate()

  const [etape, setEtape] = useState('accueil')
  const [nom, setNom] = useState('')
  const [code, setCode] = useState('')
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)
  const [sessionCode, setSessionCode] = useState('')

  const nomRef         = useRef('')
  const codeRef        = useRef('')
  const sessionCodeRef = useRef('')
  const chargementRef  = useRef(false)

  useEffect(() => {
    function onSessionCreee({ code: sc }) {
      sessionCodeRef.current = sc
      chargementRef.current  = false
      setSessionCode(sc)
      setChargement(false)
      setEtape('attente')
    }

    function onSessionLancee() {
      const estConsole = !!sessionCodeRef.current
      const c = sessionCodeRef.current || codeRef.current
      const n = nomRef.current
      const state = { code: c, nom: n, isHote: true, sequenceIndex: 0, energie: 100 }
      navigate(estConsole ? '/video' : '/choix', { state })
    }

    function onErreurCode() {
      setErreur('Code invalide. Vérifie l\'affichage de la Console.')
      setChargement(false)
    }

    function onConnectError() {
      if (chargementRef.current) {
        chargementRef.current = false
        setErreur('Impossible de joindre le serveur. Vérifie le réseau.')
        setChargement(false)
      }
    }

    socket.on('session-creee',  onSessionCreee)
    socket.on('session-lancee', onSessionLancee)
    socket.on('erreur-code',    onErreurCode)
    socket.on('connect_error',  onConnectError)

    return () => {
      socket.off('session-creee',  onSessionCreee)
      socket.off('session-lancee', onSessionLancee)
      socket.off('erreur-code',    onErreurCode)
      socket.off('connect_error',  onConnectError)
    }
  }, [navigate])

  function creerSession(e) {
    e.preventDefault()
    if (!nom.trim()) return setErreur('Entre un nom.')
    nomRef.current = nom.trim()
    chargementRef.current = true
    setChargement(true)
    setErreur('')
    socket.emit('creer-session', nom.trim())
  }

  function rejoindreSession(e) {
    e.preventDefault()
    if (!nom.trim()) return setErreur('Entre ton prénom.')
    if (!code.trim()) return setErreur('Entre le code de session.')
    nomRef.current        = nom.trim()
    codeRef.current       = code.trim().toUpperCase()
    chargementRef.current = true
    setChargement(true)
    setErreur('')
    socket.emit('rejoindre-session', { code: code.trim().toUpperCase(), nomJoueur: nom.trim() })
  }

  return (
    <div className="accueil" ref={containerRef}>
      <div className="brume brume-bas" />
      <div className="brume brume-haut" />

      <div className="accueil-contenu">
        <div className="ligne-deco"><span>Enquête interactive</span></div>

        <h1 className="accueil-titre">
          JACK<br />
          <span className="accent">CARTER</span>
        </h1>

        <p className="accueil-sous-titre">La nuit est tombée. Quelqu'un sait ce qui s'est passé.</p>

        {etape === 'accueil' && (
          <div className="accueil-boutons">
            <button className="btn-hote" onClick={() => setEtape('hote')}>
              <img className="btn-icone" src="/assets/icons/monitor.png" alt="" />
              <span className="btn-texte">
                <strong>Console</strong>
                <small>Créer une session (PC / TV)</small>
              </span>
            </button>
            <span className="separateur">ou</span>
            <button className="btn-joueur" onClick={() => setEtape('joueur')}>
              <img className="btn-icone" src="/assets/icons/console.png" alt="" />
              <span className="btn-texte">
                <strong>Manette</strong>
                <small>Rejoindre avec un code (iPad)</small>
              </span>
            </button>
          </div>
        )}

        {etape === 'hote' && (
          <form className="accueil-form" onSubmit={creerSession}>
            <p className="form-titre">Console — Créer une session</p>
            <input
              className="form-input"
              type="text"
              placeholder="Nom de la session"
              maxLength={20}
              value={nom}
              onChange={e => setNom(e.target.value)}
              autoFocus
            />
            {erreur && <p className="form-erreur">{erreur}</p>}
            <div className="form-actions">
              <button type="button" className="btn-retour" onClick={() => { setEtape('accueil'); setErreur('') }}>
                ← Retour
              </button>
              <button type="submit" className="btn-hote" disabled={chargement}>
                {chargement ? 'Génération...' : 'Générer le code'}
              </button>
            </div>
          </form>
        )}

        {etape === 'joueur' && (
          <form className="accueil-form" onSubmit={rejoindreSession}>
            <p className="form-titre">Manette — Rejoindre</p>
            <input
              className="form-input"
              type="text"
              placeholder="Ton prénom"
              maxLength={20}
              value={nom}
              onChange={e => setNom(e.target.value)}
              autoFocus
            />
            <input
              className="form-input form-input-code"
              type="text"
              placeholder="Code affiché sur la Console"
              maxLength={5}
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
            />
            {erreur && <p className="form-erreur">{erreur}</p>}
            <div className="form-actions">
              <button type="button" className="btn-retour" onClick={() => { setEtape('accueil'); setErreur('') }}>
                ← Retour
              </button>
              <button type="submit" className="btn-joueur" disabled={chargement}>
                {chargement ? 'Connexion...' : 'Connecter la manette'}
              </button>
            </div>
          </form>
        )}

        {etape === 'attente' && (
          <div className="attente-ipad">
            <p className="form-titre">Code de session</p>
            <div className="session-code-display">{sessionCode}</div>
            <p className="attente-message">En attente de la Manette (iPad)…</p>
            <p className="attente-hint">Saisir ce code sur l'iPad pour démarrer</p>
          </div>
        )}

        <div className="ligne-deco" style={{ marginTop: 8 }}>
          <span>Console + Manette</span>
        </div>
      </div>

    </div>
  )
}

export default Accueil
