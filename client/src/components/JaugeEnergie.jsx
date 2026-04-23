import { useEffect, useRef, useState } from 'react'
import './JaugeEnergie.css'

function JaugeEnergie({ valeur = 100, segments = 10, taille = 'md', label = false }) {
  const cible    = Math.max(0, Math.min(100, valeur))
  const nbAllume = Math.round(cible / 100 * segments)

  const couleur  = cible >= 60 ? '#27ae60' : cible >= 30 ? '#e6b800' : '#c0392b'
  const critique = cible < 30

  const prevRef    = useRef(nbAllume)
  const [delays, setDelays] = useState(() => Array(segments).fill(0))

  useEffect(() => {
    const prev = prevRef.current
    const next = nbAllume
    prevRef.current = next

    if (next === prev) return

    const montee = next > prev
    const newDelays = Array.from({ length: segments }, (_, i) => {
      if (montee  && i >= prev && i < next) return (i - prev)       * 45
      if (!montee && i >= next && i < prev) return (prev - 1 - i)   * 45
      return 0
    })
    setDelays(newDelays)
  }, [nbAllume, segments])

  return (
    <div className={`jauge-energie jauge-${taille}`}>
      {label && <span className="jauge-label">ÉNERGIE</span>}
      <div className="jauge-blocs">
        {Array.from({ length: segments }, (_, i) => {
          const allume = i < nbAllume
          return (
            <div
              key={i}
              className={`jauge-bloc ${allume ? 'allume' : ''} ${allume && critique ? 'critique' : ''}`}
              style={{
                '--seg-color':   couleur,
                transitionDelay: delays[i] + 'ms',
              }}
            />
          )
        })}
      </div>
      <span className="jauge-val" style={{ color: couleur }}>{Math.round(cible)}%</span>
    </div>
  )
}

export default JaugeEnergie
