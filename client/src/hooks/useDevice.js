// Détecte le type d'appareil selon le support tactile et la largeur d'écran.
// Retourne : 'telephone' | 'tablette' | 'web'
//
// Signal primaire : navigator.maxTouchPoints
//   > 0  → appareil tactile (iPad, tablette Android, téléphone)
//   = 0  → bureau (PC / TV / Mac sans écran tactile)
//
// Plus fiable que l'User-Agent car iPadOS 13+ se présente comme "MacIntel"
// et les grands iPad Pro (≥ 1200px en paysage) dépassent le seuil de largeur.

import { useState, useEffect } from 'react'

function useAppareil() {

  function detecter() {
    const largeur    = window.innerWidth
    const estTactile = navigator.maxTouchPoints > 0
    const estPhone   = /Android|iPhone|iPod/i.test(navigator.userAgent)

    if (estTactile && estPhone && largeur < 768) return 'telephone'
    if (estTactile) return 'tablette'
    if (largeur < 1200) return 'tablette'
    return 'web'
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
