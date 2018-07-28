'use strict';
const io = require('socket.io-client');

const socketURL = 'http://localhost:' + 8011;
const options = {
	transports: ['websocket', 'xhr-polling'],
	path: '/api',
};
const client = io.connect(socketURL, options);


// create a server
