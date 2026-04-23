import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import socket from '../socket'
import './Lobby.css'

function Lobby() {
  const { state } = useLocation()
  const navigate = useNavigate()

  const { code, nom, isHote, joueursInitiaux } = state || {}

  const [joueurs, setJoueurs] = useState(joueursInitiaux || [])
  const [estPret, setEstPret] = useState(false)

  useEffect(() => {
    if (!code) navigate('/', { replace: true })
  }, [code, navigate])

  useEffect(() => {
    socket.on('liste-joueurs', (liste) => {
      setJoueurs(liste)
    })

    socket.on('session-lancee', () => {
      navigate('/video', { state: { code, nom, isHote } })
    })

    return () => {
      socket.off('liste-joueurs')
      socket.off('session-lancee')
    }
  }, [code, nom, isHote, navigate])

  function marquerPret() {
    setEstPret(true)
    socket.emit('joueur-pret', code)
  }

  function lancerSession() {
    socket.emit('lancer-session', code)
  }

  const tousPretsCount = joueurs.filter(j => j.pret).length
  const tousPretsRatio = joueurs.length > 0 ? Math.round((tousPretsCount / joueurs.length) * 100) : 0

  return (
    <div className="lobby">
      <div className="lobby-haut">
        <p className="lobby-surtitre">Salle d'attente</p>
        <div className="lobby-code">
          <span className="code-label">Code de session</span>
          <span className="code-valeur">{code}</span>
          <span className="code-hint">Partage ce code avec tes amis</span>
        </div>
      </div>

      <div className="lobby-joueurs">
        <p className="joueurs-titre">Joueurs connectés — {joueurs.length}</p>
        <ul className="joueurs-liste">
          {joueurs.map((j) => (
            <li key={j.id} className={`joueur-item ${j.pret ? 'pret' : ''}`}>
              <span className="joueur-nom">
                {j.nom}
                {j.id === socket.id && <span className="joueur-moi"> (toi)</span>}
              </span>
              <span className="joueur-statut">
                {j.pret ? '✓ Prêt' : 'En attente…'}
              </span>
            </li>
          ))}
        </ul>

        <div className="pret-barre-fond">
          <div className="pret-barre-remplie" style={{ width: tousPretsRatio + '%' }} />
        </div>
        <p className="pret-compteur">{tousPretsCount}/{joueurs.length} prêts</p>
      </div>

      <div className="lobby-actions">
        {!isHote && !estPret && (
          <button className="btn-pret" onClick={marquerPret}>
            Je suis prêt
          </button>
        )}
        {!isHote && estPret && (
          <p className="attente-hote">En attente de l'hôte…</p>
        )}
        {isHote && (
          <button
            className="btn-lancer"
            onClick={lancerSession}
            disabled={joueurs.length < 1}
          >
            {joueurs.length < 1
              ? 'En attente de joueurs…'
              : `Lancer l'expérience → (${tousPretsCount}/${joueurs.length} prêts)`}
          </button>
        )}
      </div>
    </div>
  )
}

export default Lobby
