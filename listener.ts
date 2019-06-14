import { getOriginalDst } from 'node-getsockopt';
import { promisify } from 'util';
import { IncomingMessage, ServerResponse } from 'http';
import { promisifyClientRequest } from './util';

import http = require('http');

const getOriginalDstAsync = promisify(getOriginalDst);

export default async function listener(
    request: IncomingMessage,
    response: ServerResponse,
): Promise<void> {
    const {
        headers, socket, method, url,
    } = request;
    const protocol = 'http:';
    const addrInfo = await getOriginalDstAsync(socket);
    const { address: hostname, port, family } = addrInfo;

    const proxyRequest = http.request({
        agent: false,
        family,
        headers,
        hostname,
        method,
        path: url,
        port,
        protocol,
    });

    try {
        request.pipe(proxyRequest);
        const proxyResponse = await promisifyClientRequest(proxyRequest);
        const { headers: proxyHeaders, statusCode } = proxyResponse;
        response.writeHead(statusCode, proxyHeaders);
        proxyResponse.pipe(response);
    } catch (e) {
        socket.destroy();
    }
}
