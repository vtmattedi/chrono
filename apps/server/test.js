import WebSocket from 'ws';
const PORT = 3000;
const ws = new WebSocket('ws://localhost:' + PORT + '/echo');
let a = 0
ws.on('open', function open() {
    console.log('Connected to WebSocket server');
     console.log(ws.url);
     const tm = setInterval(() => {
        ws.send(`Message ${++a}`);
        if (a >= 10) {
            clearInterval(tm);
            ws.close();
        }
     }, 1000); // Wait for 1 second before sending a message
});

ws.on('message', function incoming(data) {
    console.log('Received:', data.toString());
});

ws.on('close', function close() {
    console.log('Disconnected from WebSocket server');
});

ws.on('error', function error(err) {
    console.error('WebSocket error:', err);
});

// ws.send('This is a test message');
// setTimeout(() => {
//     ws.close();
// }, 5000); // Close the connection after 5 seconds