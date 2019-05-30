import listener from './listener';

import net = require('net');

const PORT = 42926;


const { Server } = net;
const server = new Server();
server.on('connection', listener);
server.listen(PORT);
