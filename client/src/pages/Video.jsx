// Page de lecture vidéo synchronisée
import React from 'react'

function Video() {
  return (
    <div className="page">
      <h1>Vidéo en cours</h1>

      {/* Placeholder vidéo — sera remplacé par Video.js plus tard */}
      <div style={{ background: '#000', width: '100%', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        Placeholder vidéo
      </div>

      <p>Barre de progression ici</p>
    </div>
  )
}

export default Video
