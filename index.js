// SHC | ROOM 1 — HaxBall Headless Host para Node.js / Render
// Configura HAXBALL_TOKEN como variable de entorno en Render.
// No subas el token a GitHub.

const HaxballJS = require("haxball.js").default;

const HAXBALL_TOKEN = process.env.HAXBALL_TOKEN;
if (!HAXBALL_TOKEN) {
  console.error("❌ Falta la variable de entorno HAXBALL_TOKEN en Render.");
  process.exit(1);
}

// haxball.js inicializa el entorno WebRTC de Node y entrega HBInit de forma asíncrona.
HaxballJS().then((HBInit) => {
  if (typeof HBInit !== "function") {
    throw new TypeError("haxball.js no devolvió una función HBInit válida.");
  }

  const room = HBInit({
    roomName: "SHC | ROOM 1",
    maxPlayers: 20,
    noPlayer: true,
    public: false,
    token: HAXBALL_TOKEN
  });

// 📊 LISTAS DE RANGOS VIP
const VIP_ORIGINS = ["YeremiX", "Rubio"];
const VIP_NEBULA = ["ZeuXinho"]; 
const VIP_NOVA = ["Diomande"];
const VIP_ASTRONAUTA = []; 

let queueCounter = 1;
let choosingPlayer = null; 
let playersData = new Map();
let realPlayersJoinedCount = 0; // Contador para los 2 primeros administradores

// Simular el jugador persistente STELLAR ÁRBITRO
let arbitroId = 999;
setTimeout(() => {
    if (typeof room.fakePlayerJoin === "function") {
        room.fakePlayerJoin(arbitroId, "STELLAR ÁRBITRO", "🤖", true);
        console.log("🤖 STELLAR ÁRBITRO ha sido inyectado de forma persistente.");
    }
}, 1000);

room.onRoomLink = function(link) {
console.log("🚀 ¡SALA ABIERTA CON ÉXITO! Enlace de acceso:\n" + link);
};

room.onPlayerJoin = function(player) {
// Evitar que el árbitro afecte las colas reales
if (player.id === arbitroId || player.name === "STELLAR ÁRBITRO") {
    return;
}

playersData.set(player.id, { name: player.name, queueNumber: queueCounter++ });
realPlayersJoinedCount++;

// Las 2 primeras personas reales reciben admin automáticamente
if (realPlayersJoinedCount <= 2) {
    room.setPlayerAdmin(player.id, true);
    room.sendAnnouncement(`👑 ¡${player.name} ha recibido ADMIN automático por ser de los primeros en entrar!`, null, 0xFFFF00, "bold");
}

const isOrigins = VIP_ORIGINS.includes(player.name);
const isNebula = VIP_NEBULA.includes(player.name);
const isNova = VIP_NOVA.includes(player.name);
const isAstronauta = VIP_ASTRONAUTA.includes(player.name);

if (isOrigins) {
room.sendAnnouncement(`¡El Máster VIP ORIGINS ${player.name} se ha conectado a la sala!`, null, 0xFFD700, "bold", 2);
room.setPlayerAdmin(player.id, true);
} else if (isNebula) {
room.sendAnnouncement(`¡El VIP NEBULA ${player.name} se ha conectado a la sala!`, null, 0x00FF7F, "bold", 1);
} else if (isNova) {
room.sendAnnouncement(`¡El VIP NOVA ${player.name} se ha conectado!`, null, 0xFF0055, "bold", 1);
} else if (isAstronauta) {
room.sendAnnouncement(`¡El VIP ASTRONAUTA 🚀 ${player.name} ha aterrizado en la sala!`, null, 0x00FFFF, "bold", 1);
} else {
const pData = playersData.get(player.id);
room.sendAnnouncement(`Bienvenido ${player.name}. Tu número de elección es el [${pData.queueNumber}].`, player.id, 0x00FF00);
}
checkAutoStart();
};

room.onPlayerLeave = function(player) {
// Si el árbitro "se va" por error del script, lo volvemos a meter
if (player.id === arbitroId || player.name === "STELLAR ÁRBITRO") {
    setTimeout(() => {
        if (typeof room.fakePlayerJoin === "function") room.fakePlayerJoin(arbitroId, "STELLAR ÁRBITRO", "🤖", true);
    }, 500);
    return;
}

if (choosingPlayer && choosingPlayer.id === player.id) {
choosingPlayer = null;
room.sendAnnouncement("El jugador que elegía se ha desconectado. Pasando al siguiente...", null, 0xFF0000);
const teamToFill = player.team !== 0 ? player.team : 1;
pickNextFromSpec(teamToFill);
}
playersData.delete(player.id);
};

room.onPlayerChat = function(player, message) {
if (player.id === arbitroId) return false; // El árbitro no chatea solo

const isOrigins = VIP_ORIGINS.includes(player.name);
const isNebula = VIP_NEBULA.includes(player.name);
const isNova = VIP_NOVA.includes(player.name);
const isAstronauta = VIP_ASTRONAUTA.includes(player.name);
const msgTrimmed = message.trim();

// BLOQUEO DE EQUIPO PARA EL ÁRBITRO (Siempre se queda en espectador)
if (player.name === "STELLAR ÁRBITRO" || player.id === arbitroId) {
    if (player.team !== 0) room.setPlayerTeam(player.id, 0);
    return false;
}

// 1. PROCESADOR DE COMANDOS (!rr, !saltastop, !bb)
if (msgTrimmed.startsWith("!")) {
const args = msgTrimmed.split(" ");
const command = args[0].toLowerCase(); 

if (command === "!rr") {
    if (player.admin) {
        room.restartGame();
    } else {
        room.sendAnnouncement("❌ El comando !rr está restringido solo para administradores de la sala.", player.id, 0xFF0000);
    }
    return false;
}

if (command === "!bb") {
room.sendAnnouncement(`👋 ${player.name} abandonó la sala usando !bb`, null, 0xaaaaaa);
room.kickPlayer(player.id, "¡Gracias por jugar! Volvé cuando quieras.", false);
return false;
}

// VIP ORIGINS y VIP ASTRONAUTA tienen permitido usar el salto de cola
if (command === "!saltastop" && (isOrigins || isAstronauta)) {
const redCount = room.getPlayerList().filter(p => p.team === 1).length;
const blueCount = room.getPlayerList().filter(p => p.team === 2).length;

if (redCount < 5) {
room.setPlayerTeam(player.id, 1);
room.sendAnnouncement(`${player.name} usó !saltastop y saltó a RED.`, null, 0x00FFFF);
} else if (blueCount < 5) {
room.setPlayerTeam(player.id, 2);
room.sendAnnouncement(`${player.name} usó !saltastop y saltó a BLUE.`, null, 0x00FFFF);
} else {
room.sendAnnouncement("Los equipos están llenos. No puedes usar el salto de cola ahora.", player.id, 0xFF0000);
}
return false;
}
}

// 2. SISTEMA DE MENSAJERÍA PRIVADA (PM [Nombre] [Mensaje])
if (msgTrimmed.toUpperCase().startsWith("PM ")) {
    const parts = msgTrimmed.split(" ");
    if (parts.length >= 3) {
        const targetName = parts[1];
        const privateMsg = parts.slice(2).join(" ");
        
        const targetPlayer = room.getPlayerList().find(p => p.name.toLowerCase() === targetName.toLowerCase());
        
        if (targetPlayer) {
            room.sendAnnouncement(`🔒 [PM de ${player.name}]: ${privateMsg}`, targetPlayer.id, 0xFFA500, "italic");
            room.sendAnnouncement(`🔒 [PM enviado a ${targetPlayer.name}]: ${privateMsg}`, player.id, 0xFFA500, "italic");
        } else {
            room.sendAnnouncement(`❌ No se encontró al jugador con el nombre "${targetName}" en la sala.`, player.id, 0xFF0000);
        }
    } else {
        room.sendAnnouncement("⚠️ Uso correcto: PM [Nombre] [Mensaje]", player.id, 0xFF0000);
    }
    return false;
}

// 3. SISTEMA DE DRAFT (Selección)
if (choosingPlayer && player.id === choosingPlayer.id) {
const targetNum = parseInt(msgTrimmed);
if (!isNaN(targetNum)) {
let targetPlayer = room.getPlayerList().find(p => {
const data = playersData.get(p.id);
return p.team === 0 && data && data.queueNumber === targetNum;
});

if (targetPlayer) {
const teamTarget = choosingPlayer.targetTeam; 
room.setPlayerTeam(targetPlayer.id, teamTarget); 
room.sendAnnouncement(`${choosingPlayer.name} eligió a ${targetPlayer.name} [${targetNum}].`, null, 0x00FF00);
choosingPlayer = null; 
checkAutoStart();
} else {
room.sendAnnouncement("Número erróneo o el jugador ya no está en Espectadores. Escribe otro número.", player.id, 0xFF0000);
}
return false;
}
}

// 4. CHAT DE EQUIPO PRIVADO ('t mensaje')
if (msgTrimmed.startsWith("t ") || msgTrimmed.startsWith("T ")) {
const teamMsg = msgTrimmed.substring(2).trim();
const playerTeam = player.team;
if (playerTeam !== 0 && teamMsg.length > 0) {
let teamPlayers = room.getPlayerList().filter(p => p.team === playerTeam);
let chatColor = playerTeam === 1 ? 0xFF8888 : 0x8888FF;
teamPlayers.forEach(p => {
room.sendAnnouncement(`[EQUIPO] ${player.name}: ${teamMsg}`, p.id, chatColor, "bold");
});
return false;
} else if (playerTeam === 0) {
room.sendAnnouncement("⚠️ Debes estar asignado a un equipo para usar el chat de equipo.", player.id, 0xFF0000);
return false;
}
}

// 5. CHAT PERSONALIZADO POR RANGOS (Con prefijos y colores)
if (isOrigins) {
room.sendAnnouncement(`[VIP ORIGINS] ${player.name}: ${message}`, null, 0xFF69B4, "bold");
return false;
}
if (isNebula) {
room.sendAnnouncement(`[VIP NEBULA] ${player.name}: ${message}`, null, 0x00FF7F, "bold");
return false;
}
if (isNova) {
room.sendAnnouncement(`[VIP NOVA] ${player.name}: ${message}`, null, 0xFF0055, "bold");
return false;
}
if (isAstronauta) {
room.sendAnnouncement(`[🚀 VIP ASTRONAUTA] ${player.name}: ${message}`, null, 0x00FFFF, "bold");
return false;
}

return true;
};

// ⚽ DETECTOR DE TOQUES (Rastro del Balón Diferenciado)
room.onPlayerBallKick = function(player) {
    room.lastTouch = player; 
    
    // VIP ORIGINS y VIP ASTRONAUTA cambian el color del balón a Rosa Neón. Los demás mantienen el blanco.
    if (VIP_ORIGINS.includes(player.name) || VIP_ASTRONAUTA.includes(player.name)) {
        room.setDiscProperties(0, { color: 0xFF69B4 }); 
    } else {
        room.setDiscProperties(0, { color: 0xFFFFFF }); 
    }
};

room.onTeamGoal = function(team) {
    const scorer = room.lastTouch;
    room.setDiscProperties(0, { color: 0xFFFFFF }); // Resetear color de balón siempre

    if (scorer && scorer.team === team) {
        // GOL VIP ORIGINS
        if (VIP_ORIGINS.includes(scorer.name)) {
            room.sendAnnouncement("✨🎆 ¡¡¡GOLAZO VIP ORIGINS!!! 🎆✨", null, 0xFFD700, "bold", 2);
            room.sendAnnouncement(`👑 ¡El Máster ${scorer.name} destrozó la portería rival! 👑`, null, 0xFF69B4, "bold", 1);

            let frames = ["👑", "🔥", "⚡", "⭐", "💎", "💥", "✨", "🔴", "🔵"];
            let i = 0;
            let animInterval = setInterval(() => {
                room.setPlayerAvatar(scorer.id, frames[i % frames.length]);
                i++;
            }, 40);

            setTimeout(() => {
                clearInterval(animInterval);
                room.setPlayerAvatar(scorer.id, null); 
            }, 2500);

            // Fuegos artificiales masivos en la portería enemiga
            const enemyTeam = team === 1 ? 2 : 1;
            const enemyPlayers = room.getPlayerList().filter(p => p.team === enemyTeam);
            let fxFrames = ["💥", "✨", "⚡"];
            let fxCount = 0;
            let fireworksInterval = setInterval(() => {
                enemyPlayers.forEach(p => {
                    room.setPlayerAvatar(p.id, fxFrames[fxCount % fxFrames.length]);
                });
                fxCount++;
            }, 30);

            setTimeout(() => {
                clearInterval(fireworksInterval);
                enemyPlayers.forEach(p => room.setPlayerAvatar(p.id, null));
            }, 2500);

        // GOL VIP NEBULA
        } else if (VIP_NEBULA.includes(scorer.name)) {
            room.sendAnnouncement(`✨🟢 ¡GOLAZO VIP NEBULA de ${scorer.name}! 🟢✨`, null, 0x00FF7F, "bold", 1);
            
            let esmFrames = ["⭐", "✨", "🟢", "🟩"];
            let i = 0;
            let animInterval = setInterval(() => {
                room.setPlayerAvatar(scorer.id, esmFrames[i % esmFrames.length]);
                i++;
            }, 60);

            setTimeout(() => {
                clearInterval(animInterval);
                room.setPlayerAvatar(scorer.id, null);
            }, 2000);

        // GOL VIP NOVA
        } else if (VIP_NOVA.includes(scorer.name)) {
            room.sendAnnouncement(`🔥🔴 ¡Gol Nova de ${scorer.name}! 🔴🔥`, null, 0xFF0055, "bold", 1);
            
            let rubiFrames = ["🔥", "💥", "🔴", "🟥"];
            let i = 0;
            let animInterval = setInterval(() => {
                room.setPlayerAvatar(scorer.id, rubiFrames[i % rubiFrames.length]);
                i++;
            }, 60);

            setTimeout(() => {
                clearInterval(animInterval);
                room.setPlayerAvatar(scorer.id, null);
            }, 2000);

        // GOL VIP ASTRONAUTA
        } else if (VIP_ASTRONAUTA.includes(scorer.name)) {
            room.sendAnnouncement(`🌌🚀 ¡¡GOL INTERGALÁCTICO de ${scorer.name}!! 🚀🌌`, null, 0x00FFFF, "bold", 1);
            
            let astroFrames = ["🚀", "👨‍🚀", "🌌", "⭐", "🌍"];
            let i = 0;
            let animInterval = setInterval(() => {
                room.setPlayerAvatar(scorer.id, astroFrames[i % astroFrames.length]);
                i++;
            }, 60);

            setTimeout(() => {
                clearInterval(animInterval);
                room.setPlayerAvatar(scorer.id, null);
            }, 2000);

        } else {
            room.sendAnnouncement(`⚽ Gol anotado por: ${scorer.name}`, null, 0xFFFFFF);
        }
    } else if (scorer && scorer.team !== 0) {
        room.sendAnnouncement(`⚠️ ¡Gol en contra de ${scorer.name}!`, null, 0xFF0000);
    }
    room.lastTouch = null;
};

room.onTeamVictory = function(scores) {
const winningTeam = scores.red > scores.blue ? 1 : 2;
const losingTeam = winningTeam === 1 ? 2 : 1;

const losers = room.getPlayerList().filter(p => p.team === losingTeam);

losers.forEach(p => {
    if (p.id !== arbitroId) room.setPlayerTeam(p.id, 0); 
});

room.sendAnnouncement(`El equipo perdedor ha sido removido a Espectadores. Siguiente capitán al mando.`, null, 0xFFFF00);
setTimeout(() => { pickNextFromSpec(losingTeam); }, 1500);
};

// Reestablecer balón en saques iniciales
room.onGameStart = function() {
    room.setDiscProperties(0, { color: 0xFFFFFF });
};

function pickNextFromSpec(targetTeam) {
let spectators = room.getPlayerList().filter(p => p.team === 0 && p.id !== arbitroId);
if (spectators.length === 0) {
room.sendAnnouncement("No hay espectadores en cola para continuar el drafteo.", null, 0xFF0000);
return;
}
spectators.sort((a, b) => {
const dataA = playersData.get(a.id);
const dataB = playersData.get(b.id);
return (dataA?.queueNumber || 0) - (dataB?.queueNumber || 0);
});
let captain = spectators[0]; 
room.setPlayerTeam(captain.id, targetTeam);
choosingPlayer = { id: captain.id, name: captain.name, targetTeam: targetTeam };
room.sendAnnouncement(`¡${captain.name}! Escribe en el chat el NÚMERO del jugador que quieres fichar para tu equipo.`, null, 0x00FFFF, "bold");
}

function checkAutoStart() {
if (room.getScores() !== null) return;
let redCount = room.getPlayerList().filter(p => p.team === 1).length;
let blueCount = room.getPlayerList().filter(p => p.team === 2).length;
if (redCount === 5 && blueCount === 5) {
room.sendAnnouncement("¡Alineaciones listos! El partido arranca en 3 segundos...", null, 0xFFFF00);
setTimeout(() => {
if (room.getPlayerList().filter(p => p.team === 1).length === 5 && room.getPlayerList().filter(p => p.team === 2).length === 5) {
room.startGame();
}
}, 3000);
}
}
}).catch((error) => {
  console.error("❌ No se pudo iniciar SHC | ROOM 1:", error);
  process.exit(1);
});
