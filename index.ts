import listener from './listener';

import http = require('http');

const PORT = 42926;
const server = http.createServer();
server.on('request', listener);

server.listen(PORT);
