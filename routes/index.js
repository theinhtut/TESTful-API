const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// SocketIO
// const server = require('http').Server(router);
// const io = require('socket.io')(server);

router.get('/', (req, res) =>{
    res.render('index');
});

router.get('/dashboard', (req, res) =>{
    res.render('dashboard');
});

// API Documentation 
router.get('/docs', (req, res, next) =>{
    res.render('apiDocs');
});

// io.on('connection', function (socket) {
//     socket.emit('news', { hello: 'world' });
//     socket.on('my other event', function (data) {
//       console.log(data);
//     });
// });


//server.listen(3001, console.log('PORT.server: 3001'));

module.exports = router;