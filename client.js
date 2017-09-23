//our username
var name;
var connectedUser;
//connecting to our signaling server


var socket = io();

socket.onopen = function () {
console.log("");
 console.log("Connected to the signaling server");
};
//when we got a message from a signaling server
socket.on('message', function (msg) {
    console.log("to me");
 console.log("Got message", msg);
 var data = JSON.parse(msg);
 switch(data.type) {
 case "login":
 handleLogin(data.success);
 break;
 //when somebody wants to call us
 case "offer":
 handleOffer(data.offer, data.name);
 break;
 case "answer":
 handleAnswer(data.answer);
 break;
 //when a remote peer sends an ice candidate to us
 case "candidate":
 handleCandidate(data.candidate);
 break;
 case "leave":
 console.log(data.name+" has been leaved the chat");
 handleLeave();
 break;
 default:
 break;
 }
 });
socket.on("error", function (err) {
 console.log("Got error", err);
});
//alias for sending JSON encoded messages
function send(message) {
 //attach the other peer username to our messages
 if (connectedUser) {
 message.name = connectedUser;
 }
 socket.emit('message1',JSON.stringify(message));
};
//******
//UI selectors block
//******
var loginPage = document.querySelector('#loginPage');
var usernameInput = document.querySelector('#usernameInput');
var loginBtn = document.querySelector('#loginBtn');
var callPage = document.querySelector('#callPage');
var callToUsernameInput = document.querySelector('#callToUsernameInput');
var callBtn = document.querySelector('#callBtn');
var hangUpBtn = document.querySelector('#hangUpBtn');
var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');
var yourConn;
var stream;
callPage.style.display = "none";
// Login when the user clicks the button
loginBtn.addEventListener("click", function (event) {
    console.log("login handle");
 name = usernameInput.value;
 console.log(name);
 if (name.length > 0) {
 send({
 type: "login",
 name: name
 });
 }
 
});
function handleLogin(success) {
 if (success === false) {
 alert("Ooops...try a different username");
 } else {
 loginPage.style.display = "none";
 callPage.style.display = "block";
 //**********************
 //Starting a peer connection
 //**********************
 //getting local video stream
 navigator.webkitGetUserMedia({ video: true, audio: true }, function
(myStream) {
 stream = myStream;
 //displaying local video stream on the page
 localVideo.src = window.URL.createObjectURL(stream);
 //using Google public stun server
 var configuration = {
 "iceServers": [{ "url": "stun:stun2.1.google.com:19302" }]
 };
 yourConn = new webkitRTCPeerConnection(configuration);
 // setup stream listening
 yourConn.addStream(stream);
 //when a remote user adds stream to the peer connection, we display it
 yourConn.onaddstream = function (e) {
 remoteVideo.src = window.URL.createObjectURL(e.stream);
 };
 // Setup ice handling
 yourConn.onicecandidate = function (event) {
 if (event.candidate) {
 send({
 type: "candidate",
 candidate: event.candidate
 });
 }
 };
 }, function (error) {
 console.log(error);
 });
 }
};
//initiating a call
callBtn.addEventListener("click", function () {
 var callToUsername = callToUsernameInput.value;
 if (callToUsername.length > 0) {
 connectedUser = callToUsername;
 // create an offer
 yourConn.createOffer(function (offer) {
 send({
 type: "offer",
 offer: offer
 });
 yourConn.setLocalDescription(offer);
 }, function (error) {
 alert("Error when creating an offer");
 });
 }
});
//when somebody sends us an offer
function handleOffer(offer, name) {
    console.log("receive offer from"+name );
 connectedUser = name;
 yourConn.setRemoteDescription(new RTCSessionDescription(offer));
 //create an answer to an offer
 yourConn.createAnswer(function (answer) {
 yourConn.setLocalDescription(answer);
 send({
 type: "answer",
 answer: answer
 });
 }, function (error) {
 alert("Error when creating an answer");
 });
};
//when we got an answer from a remote user
function handleAnswer(answer) {
 yourConn.setRemoteDescription(new RTCSessionDescription(answer));
};
//when we got an ice candidate from a remote user
function handleCandidate(candidate) {
 yourConn.addIceCandidate(new RTCIceCandidate(candidate));
};
//hang up
hangUpBtn.addEventListener("click", function () {
 send({
 type: "leave"
 });
 handleLeave();
});
function handleLeave() {
connectedUser ="";
 remoteVideo.src = "";
 yourConn.close();
yourConn.onicecandidate = "";
yourConn.onaddstream = "";
};
