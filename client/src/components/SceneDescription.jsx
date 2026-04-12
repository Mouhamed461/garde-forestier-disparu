import React from 'react'
import './SceneDescription.css'

/**
 * SceneDescription — Bandeau narratif affiché pendant les choix.
 * Contextualise la décision à prendre. Absent pendant la vidéo/photo.
 *
 * Props :
 *   text    {string}  — description de la scène (2-3 phrases)
 *   visible {boolean} — true pendant les choix, false sinon
 */
function SceneDescription({ text, visible }) {
  if (!text) return null

  return (
    <div
      className={`scene-desc ${visible ? 'scene-desc-visible' : 'scene-desc-cachee'}`}
      aria-hidden={!visible}
    >
      <span className="scene-desc-label">Situation</span>
      <p className="scene-desc-texte">{text}</p>
    </div>
  )
}

export default SceneDescription
