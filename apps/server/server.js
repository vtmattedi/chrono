import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import Users from './users.js';
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware example
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
    res.send('Hello from Express with Socket.IO!');
});

// Socket.IO connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    const userID = Users.addUser(socket);
    console.log('Assigned user ID:', userID);

    socket.on('message', (msg) => {
        console.log('Received message:', msg);
        // Broadcast the message to all clients
        io.emit('message', msg);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        Users.removeUser(socket);
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});