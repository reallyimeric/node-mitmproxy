import listener from './listener';
import { PORT } from './env';

import http = require('http');

const server = http.createServer();
server.on('request', listener);

server.listen(PORT);
