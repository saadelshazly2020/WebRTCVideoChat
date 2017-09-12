var app = require('express')();
var path = require('path');
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
}).use((require('express')).static(path.join(__dirname, '../videochat')));
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io')(server);
// server.listen(8080, function () {
//     console.log('listening on *:8080');
// });
server.listen(process.env.PORT || 3000, function(){
  console.log('listening on', http.address().port);
});


//require our websocket library
var WebSocketServer = require('ws').Server;
//creating a websocket server at port 9090
var wss = new WebSocketServer({port: 9090});
//all connected to the server users
var users = {};
console.log('server is listen on localhost:9090');
//when a user connects to our sever
wss.on('connection', function(connection){
 console.log('user connected');
 //when server gets a message from a connected user
 connection.on('message', function(message){
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
 
 //connection.send("Hello from server");
 
 //When the user disconnects we should clean up its connection
 connection.on("close", function(){
 if(connection.name){
 delete users[connection.name];
 if(connection.otherName){
 console.log("Disconnecting from ", connection.otherName);
 var conn = users[connection.otherName];
 conn.otherName = null;
 if(conn != null){
 sendTo(conn, {
 type: "leave"
 });
 }
 }
 }
 
 
});

 });
 function sendTo(connection, message){
 connection.send(JSON.stringify(message));
}

 