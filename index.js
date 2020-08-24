require('dotenv').config();

const WebSocket = require('ws');
const express = require('express');
const server = require('http').createServer(express());
const wss = new WebSocket.Server({ server });
const twlo = require('twilio')(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);
const speech = require('@google-cloud/speech');
const speechClient = new speech.SpeechClient();

//Configure Transcription Request
const request = {
  config: {
    encoding: 'MULAW',
    sampleRateHertz: 8000,
    languageCode: 'en-US',
    model: 'phone_call',
    use_enhanced: true
  },
  interimResults: true 
};

let currentCall;
let idx = 0;

function sendTwiML(twiml) {
  currentCall.update({ twiml }).then(r => {
    console.log('sent twiml', twiml);
  });
};

// This is built against a very simple IVR that requests you select 1 for sales or support
// It then announces that it's connecting you to sales or support and forwards the call
// As such, the patterns we search for are "sales" and "connecting" to know we reached those prompts.
const steps = [
 {pattern: /sales/, trigger: () => {
   console.log('Detected sales or support prompt');
   sendTwiML('<Response><Play digits="1" /><Pause length="15" /></Response>');
   idx++;
 }},
 {pattern: /connecting/, trigger: () => {
    console.log('Found last IVR widget, ending call');
    currentCall.update({status: 'completed'});
    process.exit(1);
 }}
];


wss.on('connection', ws => {
  console.log('New Connection Initiated');

  let recognizeStream = null;

  ws.on('message', message => {
    const msg = JSON.parse(message);
    switch (msg.event) {
      case 'connected':
        console.log('A new call has connected.');
        recognizeStream = speechClient
          .streamingRecognize(request)
          .on('error', console.error)
          .on('data', data => {
            const transcript = data.results[0].alternatives[0].transcript;
            if (!!+process.env.VERBOSE) {
                console.log(transcript);
            }

            if (transcript.match(steps[idx].pattern)) {
              steps[idx].trigger(transcript);
            }
          });
        break;
      case 'start':
        console.log(`Starting Media Stream ${msg.streamSid}`);
        break;
      case 'media':
        recognizeStream.write(msg.media.payload);
        break;
      case 'stop':
        console.log('Call Has Ended');
        recognizeStream.destroy();
        break;
    }
  });
});

server.listen(8080);
console.log('Websocket server started');
console.log('Initiating call to IVR');

twlo.calls
  .create({
    twiml: `
      <Response>
        <Start><Stream url="${process.env.HOST}"/></Start>
        <Pause length="60" />
      </Response>`,
    to: process.env.FROM_DID,
    from: process.env.TO_DID
  })
  .then(call => {
    console.log('Created call', call.sid);
    currentCall = call;
  });
