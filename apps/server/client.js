import { io } from "socket.io-client";

// /D:/Projects/ChronoBK/client.js

const token = await fetch("http://localhost:4500/api/token", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({ alias: "client" })
}).then(res => res.json()).then(data => data.token);


const sessionId = await fetch("http://localhost:4500/api/newsession", {
    method: "POST",
    headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        teams: [
            "Team A",
            "Team B",
            "Team C",
            "Team D"
        ],
        initialTime: 300 // 5 minutes in seconds
    })
}).then(res => res.json()).then(data => {
    console.log("New session response:", data);
    return data.sessionId;
});

console.log("Obtained session ID:", sessionId);

const SERVER_URL = "http://localhost:4500";

// Create a Socket.IO client instance
const socket = io(SERVER_URL);

// Listen for connection
socket.on("connect", () => {
    console.log("Connected to server with id:", socket.id);
    const data = { type: "identify", message: token }
    socket.send(JSON.stringify(data));
    socket.send(JSON.stringify({ type: "join", message: sessionId }))

});

// Example: Listen for a custom event
socket.on("message", (data) => {
    console.log("Received message:", data);
});


socket.on("tick", (data) => {
    console.log("Tick update:", data);
});
// Example: Emit a custom event
function sendMessage(msg) {
    socket.emit("message", msg);
}

// Export for use in other modules
export { socket, sendMessage };

// while(true) {
//     // Keep the connection alive
    socket.emit("ping");
//     await new Promise(resolve => setTimeout(resolve, 10000)); // Ping every 10 seconds
// }