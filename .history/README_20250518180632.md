# Voice Socket Microservice

This Node.js microservice receives audio streams in real time from clients via WebSocket. It saves each session's audio to a file (WAV or raw). No transcription is performed here; the service is designed for easy deployment on Render or similar platforms.

## Features
- Accepts binary audio data over WebSocket
- Saves each session's audio to a file
- Ready for cloud deployment

## Usage
- Start the server: `node server.js`
- Connect from a client via WebSocket and send audio chunks
- Each session's audio is saved in the `recordings/` directory

## Deployment
- Deploy to Render or any Node.js-compatible cloud platform

## Note
- This service does not transcribe audio. Transcription should be handled on the client or by a separate service.
