function jouer(src, volume = 0.7) {
  const a = new Audio(src)
  a.volume = volume
  a.play().catch(() => {})
}

function jouerBoucle(src, volume = 0.35) {
  const a = new Audio(src)
  a.volume = volume
  a.loop = true
  a.play().catch(() => {})
  return a
}

export default function useAudio() {
  return {
    click:        () => jouer('/assets/audio/click.mp3',        0.5),
    bonChoix:     () => jouer('/assets/audio/bon-choix.mp3',    0.8),
    mauvaisChoix: () => jouer('/assets/audio/mauvais-choix.mp3',0.8),
    tempsFini:    () => jouer('/assets/audio/temps-fini.mp3',   0.7),
    timerBoucle:  () => jouerBoucle('/assets/audio/timer.mp3'),
  }
}
