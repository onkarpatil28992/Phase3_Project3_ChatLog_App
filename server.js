
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://127.0.0.1/chat";
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const client = new Server(server);

app.get('/', (req, res) => {
    res.sendFile(__dirname+'/index.html');
});

server.listen(5000, () => {
  console.log('listening on port :5000');
});
//Data base

    MongoClient.connect(url,function(err,db){
        var dbo=db.db("chat");
    if(err){
        throw err;
    }

    console.log('MongoDB connected...');

    // Connecting to Socket.io
    client.on('connection', function(socket){
        let chat = dbo.collection('chats');

        // Creating function to send status
        sendStatus = function(s){
            socket.emit('status', s);
        }

        // Getting chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
            if(err){
                throw err;
            }

            // Emitting the messages
            socket.emit('output', res);
        });

        // Handling input events
        socket.on('input', function(data){
            let name = data.name;
            let message = data.message;

            // Checking for name and message
            if(name == '' || message == ''){
                // Send error status
                sendStatus('Please enter a name and message');
            } else {
                // Inserting message
                chat.insert({name: name, message: message}, function(){
                    client.emit('output', [data]);

                    // Sending status object
                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    });
                });
            }
        });

        // Handling clear
        socket.on('clear', function(data){
            // Removing all chats from collection
            chat.remove({}, function(){
                // Emitting cleared
                socket.emit('cleared');
            });
        });
    });
});
// prious colletion to csv file 
const fastcsv = require("fast-csv");
const fs = require("fs");
const ws = fs.createWriteStream("public/chats.csv");
MongoClient.connect(
    url,
    { useNewUrlParser: true, useUnifiedTopology: true },
    (err, client) => {
    if (err) throw err;
    client
      .db("chat")
      .collection("chats")
      .find({})
      .toArray((err, data) => {
        if (err) throw err;
        console.log('');
        fastcsv
          .write(data, { headers: true })
          .on("finish", function() {
            console.log('Click on this link to start the app -->  http://localhost:5000/');
          })
          .pipe(ws);
        client.close();
      });
  }
          );
app.use(express.static('public'));      
app.get('/', (req, res) => {
    res.send(chats.csv);
});
      

      
