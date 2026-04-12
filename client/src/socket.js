// Singleton Socket.io — une seule connexion partagée dans toute l'appli.
import { io } from 'socket.io-client'

const SERVEUR = window.location.hostname === 'localhost'
  ? 'http://localhost:4000'
  : `http://${window.location.hostname}:4000`

// Démarre en polling (XHR), puis monte en WebSocket si disponible.
// Évite les blocages de Safari sur les connexions WebSocket en IP locale.
const socket = io(SERVEUR, {
  transports: ['polling', 'websocket'],
  withCredentials: false,
})

export default socket
