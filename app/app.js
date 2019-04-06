// moduli utilizzati dal progetto

var express = require('express');
var app = express();

var MongoClient = require('mongodb').MongoClient;

// configurazione motore di render

app.set('views', './views');
app.set('view engine', 'pug');

// gestione della homepage

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/avvisa.html');
});

// a differenza di quanto visto finora, si utilizza un server https,
// necessario perché altrimenti la geolocalizzazione non funziona

var fs = require('fs');
var https = require('https');

// per la creazione di un server https sono necessari una chiave (key) 
// ed un certificato (cert) per certificare il sito e quindi poter utilizzare
// https. Il seguente comando (digitato nel terminal)

// openssl req -nodes -new -x509 -keyout server.key -out server.cert

// permette al creazione di questi certificati che però,
// ovviamente, non vengono accettati dal browser ma permettojno ugualmente
// di utilizzare la geolocalizzazione


var server = https.createServer({
  key: fs.readFileSync(__dirname + '/server.key'),
  cert: fs.readFileSync(__dirname + '/server.cert')
}, app);

server.listen(3000, function () {
  console.log('Example app listening on port 3000! Go to https://localhost:3000/')
});

// cambia anche la sintassi per la creazione delle socket

var io = require('socket.io').listen(server);

io.on('connection', function(socket){ // gestisce le connessioni
  
  console.log('a user connected');  
  
  socket.on('segnalazione', function(msg){
    // parte del codice che gestisce la ricezione della segnalazione di un volontario e il successivo invio a tutti gli altri
    
    // scrivere il codice per visualizzare su console le informazioni ricevute
    // e per spedire la segnalazione a tutti i volontari connessi ad eccezione del mittente
    
    console.log('posizione: ' + msg.posizione.lat + ' ' + msg.posizione.lng); // sulla console viene visualizzato il messaggio ricevuto
    socket.broadcast.emit('segnalazione', msg); // spedito a tutti tranne che al mittente
    
    // memorizzazione nel database di MongoDB
    MongoClient.connect('mongodb+srv://admin:MwbZUn1JUfbuRoSK@galvani-c4mon.mongodb.net/?retryWrites=true,{useNewUrlParser: true}', function(err, db) {
      if (err) {
        throw err;
      }
      var dbo = db.db("5E");
      var newInfo = {data: new Date(Date.now()).toISOString(), lat: msg.posizione.lat, lng: msg.posizione.lng, indirizzo: msg.indirizzo };
      dbo.collection("ProtezioneCivile").insertOne(newInfo, function(err, result) {
        if (err) throw err;
        db.close();
      });
    });
    
  });
  
  socket.on('disconnect', function(){ // quando viene ricevuto l'evento 'disconnect'
    console.log('user disconnected'); // viene visualizzato il messaggio che un utente si è disconnesso sulla console del server
  });
  
});
