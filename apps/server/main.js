import express from 'express';
import expressWsModule from 'express-ws';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
const app = express();
const expressWs = expressWsModule(app);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isPageRoute = (uri) => {
// Returns true if the URI is a page route (no extension or .html/.htm)
    const REGEX = /(\.(htm(l)?)$)|(^[^\.]*.?$)/
    console.log('isPageRoute', uri, REGEX.test(uri));
  return REGEX.test(uri);

}

app.use(function (req, res) {
    const lan =  req.headers['accept-language']
    const ext = req.url.split('.').pop();
    
 
    const filename = req.url === '/' ? '/index.html' : req.url;
    const isRoute =  isPageRoute(req.url);
    const filePath = path.join(__dirname, 'front', 'dist', isRoute ? 'index.html' : filename.slice(1));

    if (fs.existsSync(filePath) === false) {
    }
    console.log('Serving file:', filePath, 'for URL:', req.url, 'isRoute:', isRoute, );
    res.sendFile(filePath, function (err) {
        if (err) {
           console.error('Error sending file:', err);
         res.status(500).send(
              'Error occurred while sending the file.'
         );
        } else {
            res.end();
        }
    });
});


app.ws('/echo', function (ws, req) {
    ws.on('message', function (msg) {
        console.log(msg);
        ws.send(msg);
    });
    console.log('client connected: ', ws._socket.remoteAddress);
    ws.on('close', function () {
        console.log('client disconnected: ', ws._socket.remoteAddress);
    });
});

app.listen(3000);
console.log('Server is running on http://localhost:3000');