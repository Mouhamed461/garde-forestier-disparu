import React from 'react'
import './SceneDescription.css'

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
