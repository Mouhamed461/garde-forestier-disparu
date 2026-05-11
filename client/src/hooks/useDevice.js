// maxTouchPoints > 0 détecte les tablettes plus fiablement que l'User-Agent :
// iPadOS 13+ se présente comme "MacIntel" et les grands iPad Pro (≥ 1200px)
// dépassent le seuil de largeur qu'on utilise comme signal secondaire.

import { useState, useEffect } from 'react'

function useAppareil() {

  function detecter() {
    const estTactile = navigator.maxTouchPoints > 0
    const largeur    = window.innerWidth
    if (estTactile || largeur < 1200) return 'manette'
    return 'console'
  }

  const [appareil, setAppareil] = useState(detecter)

  useEffect(() => {
    function surRedimensionnement() { setAppareil(detecter()) }
    window.addEventListener('resize', surRedimensionnement)
    return () => window.removeEventListener('resize', surRedimensionnement)
  }, [])

  return appareil
}

export default useAppareil
