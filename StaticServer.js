'use strict';

var express= require('express');
const socketIO = require('socket.io');
var path = require('path');
const PORT = process.env.PORT || 9090;
const server = express().get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
}).use((require('express')).static(path.join(__dirname, '/')) ).listen(PORT, () => console.log(`Listening on ${ PORT }`));

const io = socketIO(server);
//all connected to the server users
var users = {};
console.log('server is listen on localhost:9090');
//when a user connects to our sever
io.on('connection', function(connection){
 console.log('user connected'+"port="+PORT);
 //when server gets a message from a connected user
 connection.on('message1', function(message){
 var data;
 //accepting only JSON messages
 try {
 data = JSON.parse(message);
 }catch(e){
 console.log('invalid Json');
 data={};
 }
 //swiching the type of the user message
 switch(data.type)
 {
 //when a user try to log in 
 case "login":
 console.log("User logged:",data.name);
 //if anyone is logged in with that username then refuse
 if(users[data.name]){
console.log("connection success");
 sendTo(connection,{
 type:"login",
 success:false
 });
 }else{
 //save user connection on the server
 users[data.name]=connection;
 connection.name=data.name;
 sendTo(connection,{
 type:"login",
 success:true
 });
 }
 break;
 case "offer":
 //for ex. UserA wants to call UserB
 console.log("Sending offer to: ", data.name);
 //if UserB exists then send him offer details
 var conn = users[data.name];
 if(conn != null){
 //setting that UserA connected with UserB
 connection.otherName = data.name;
 sendTo(conn, {
 type: "offer",
 offer: data.offer,
 name: connection.name
 });
 }
 break;
 case "answer":
 console.log("Sending answer to: ", data.name);
 //for ex. UserB answers UserA
var conn = users[data.name];
if(conn != null){
connection.otherName = data.name;
 sendTo(conn, {
 type: "answer",
 answer: data.answer
});
}
break;
case "candidate":
 console.log("Sending candidate to:",data.name);
 var conn = users[data.name];
 if(conn != null){
 sendTo(conn, {
 type: "candidate",
 candidate: data.candidate
 });
 }
 break;
case "leave":
 console.log("Disconnecting from", data.name);
 var conn = users[data.name];
 conn.otherName = null;
 //notify the other user so he can disconnect his peer connection
 if(conn != null){
 sendTo(conn, {
 type: "leave"
 });
 }
 break;

 default:
 sendTo(connection, {
 type: "error",
 message: "Command no found: " + data.type
 });
 break;
 }
 });
 
//  connection.send("Hello from server");
 
 //When the user disconnects we should clean up its connection
 connection.on('disconnect', function(){
   console.log("disconnect");
   var leaved;
 if(connection.name){
   console.log('disconnect name:'+connection.otherName);
   leaved=connection.otherName;
 delete users[connection.name];
 if(connection.otherName){
 console.log("Disconnecting from other name: ", connection.name);
 leaved=connection.name;
 var conn = users[connection.otherName];
 conn.otherName = null;
 if(conn != null){
 sendTo(conn, {
 type: "leave",
 name:leaved
 });
 }
 }
 }
 
 
});

 });
 function sendTo(connection, message){
 connection.send(JSON.stringify(message));
}

 