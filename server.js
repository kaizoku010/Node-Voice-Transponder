const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const wav = require('wav');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const RECORDINGS_DIR = path.join(__dirname, 'recordings');
if (!fs.existsSync(RECORDINGS_DIR)) {
  fs.mkdirSync(RECORDINGS_DIR);
}

// Serve static files for the UI
app.use(express.static(path.join(__dirname, 'public')));

wss.on('connection', (ws) => {
  let fileWriter = null;
  let sessionId = uuidv4();
  let filePath = path.join(RECORDINGS_DIR, `${sessionId}.wav`);

  ws.on('message', (msg, isBinary) => {
    // Handle CLIENT_READY for broadcast control
    try {
      const parsed = JSON.parse(msg.toString());
      if (parsed.type === 'CLIENT_READY') {
        ws.send(JSON.stringify({ type: 'START_BROADCAST' }));
        console.log(`[${sessionId}] Sent START_BROADCAST to client.`);
        return;
      }
    } catch {}
    if (!fileWriter) {
      // Expect a JSON header first with audio format info
      try {
        const header = JSON.parse(msg.toString());
        if (header.type === 'START') {
          // Example: { type: 'START', sampleRate: 44100, channels: 1 }
          fileWriter = new wav.FileWriter(filePath, {
            sampleRate: header.sampleRate || 44100,
            channels: header.channels || 1
          });
          console.log(`[${sessionId}] Recording started: ${filePath}`);
        }
      } catch {
        // Not JSON, treat as binary audio
        if (fileWriter && isBinary) {
          fileWriter.write(msg);
          console.log(`[${sessionId}] Received audio chunk (${msg.length} bytes)`);
          // Echo audio chunk back to sender for real-time streaming
          ws.send(msg, { binary: true });
        }
      }
    } else if (isBinary) {
      fileWriter.write(msg);
      console.log(`[${sessionId}] Received audio chunk (${msg.length} bytes)`);
      // Echo audio chunk back to sender for real-time streaming
      ws.send(msg, { binary: true });
    }
  });

  ws.on('close', () => {
    if (fileWriter) {
      fileWriter.end();
      fileWriter = null;
      console.log(`[${sessionId}] Recording stopped and file saved.`);
    }
  });
});

app.get('/', (req, res) => {
  res.send('Voice Socket Microservice is running.');
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Voice Socket server listening on port ${PORT}`);
});
