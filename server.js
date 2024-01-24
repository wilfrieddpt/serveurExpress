const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const Diacritics = require('diacritics');

const app = express();
const server = http.createServer(app);
const wss = new Server({ server });

const User = require('./table/user'); // Importe le modèle User depuis le fichier existant
const Room = require('./table/room'); // Importe le modèle Room depuis le fichier existant
const userParty = require('./table/userParty'); // Importe le modèle userParty depuis le fichier existant
const bannedWords = require('./bannedWords');
const { send } = require('process');

const gameChats = {};
app.use(express.json());










// Synchronise le modèle Room avec la base de données, en ajustant le modèle si nécessaire
Room.sync({ alter: true })
  .then(() => {
    console.log('Model synchronized successfully');
  })
  .catch((error) => {
    console.error('Error syncing Room model:', error);
  });

// Gestion des connexions WebSocket lorsqu'un client se connecte au serveur
wss.on('connection', function(ws, req) {

  // Écoute les messages provenant des clients WebSocket
  ws.on('message', async (message) => {

    // Convertit le message en chaîne de caractères
    const datastring = message.toString();

    // Vérifie si le message est au format JSON
    if (datastring.charAt(0) === "{") {
      // Parse la chaîne JSON en objet JavaScript
      const data = JSON.parse(datastring.replace(/'/g, '"'));

      // Vérifie si l'authentification est réussie avec la clé spécifiée
      if (data.auth === "chatappauthkey231r4") {
        try {
          // Vérifie la présence du code de jeu dans les données
          if (data.gameCode) {
            console.log("Game code socket link: " + data.gameCode);
      
            // Initialise une liste de connexions pour le code de jeu s'il n'existe pas
            if (!gameChats[data.gameCode]) {
              gameChats[data.gameCode] = new Set();
            }
      
            // Ajoute la connexion WebSocket à la liste pour le code de jeu spécifié
            gameChats[data.gameCode].add(ws);
          }

          // Logique de gestion des messages WebSocket ici...
          handleWebSocketMessage(ws, data, gameCode);
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      }
    }
  });

  // Envoie un message au client WebSocket
  sendMessage(ws, message)
  .then(() => {
    console.log('Message sent successfully');
    })
    .catch((error) => {
    console.error('Error sending message:', error);
    });

// Vérifie si le message est une image
  if (isImage(data.message)) {
    broadcastMessage(ws, data.gameCode, data.message);
  }else{
    const sanitizedMessage = sanitizeMessage(data.message);
    broadcastMessage(ws, data.gameCode, sanitizedMessage);
  }

  // Écoute l'événement de fermeture de la connexion WebSocket
  ws.on('close', () => {
    // Supprime la connexion WebSocket lors de la déconnexion
    removeFromGameChat(ws);
  });
});









function handleWebSocketMessage(sender, data, gameCode) {
    // Il faut surement ajouté des choses ici
    broadcastMessage(sender, data, gameCode);
  }
  
  function broadcastMessage(sender, message, gameCode) {
    const roomConnections = gameChats[gameCode];
    roomConnections.forEach(client => {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
  
  function removeFromGameChat(ws) {
    // Supprime la connexion WebSocket lors de la déconnexion
    for (const gameCode in gameChats) {
      if (gameChats[gameCode].has(ws)) {
        gameChats[gameCode].delete(ws);
        break;
      }
    }
  }

function sendMessage(client, message) {
    return new Promise((resolve, reject) => {
        client.send(message, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

function sanitizeMessage(message) {
  if (typeof message === 'string') {
    const normalizedMessage = Diacritics.remove(message);
    return bannedWords.reduce((acc, word) => {
      const regex = new RegExp('\\b' + word + '\\b', 'gi');
      return acc.replace(regex, '*'.repeat(word.length));
    }, normalizedMessage);
  } else {
    const normalizedMessage = Diacritics.remove(message.toString('utf-8'));
    return bannedWords.reduce((acc, word) => {
      const regex = new RegExp('\\b' + word + '\\b', 'gi');
      return acc.replace(regex, '*'.repeat(word.length));
    }, normalizedMessage);
  }
}

function isImage(data) {
  // Vérifiez si les premiers octets du message correspondent à une signature JPEG
  return (
    data[0] === 0xFF &&
    data[1] === 0xD8 &&
    data[data.length - 2] === 0xFF &&
    data[data.length - 1] === 0xD9
  );
}

// Démarrez le serveur
const port = 3000;
server.listen(port, () => {
  console.log(`Le serveur est en cours d'exécution sur http://localhost:${port}`);
});