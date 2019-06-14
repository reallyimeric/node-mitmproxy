import { getOriginalDst } from 'node-getsockopt';
import { promisify } from 'util';
import { IncomingMessage, ServerResponse } from 'http';

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
    const responsePromise = new Promise<IncomingMessage>((resolve, reject): void => {
        proxyRequest.on('response', (proxyResponse: IncomingMessage): void => {
            resolve(proxyResponse);
        });
        proxyRequest.on('error', (err): void => {
            reject(err);
        });
        proxyRequest.on('abort', (): void => {
            reject(new Error('aborted'));
        });
        proxyRequest.on('timeout', (): void => {
            proxyRequest.abort();
        });
    });

    try {
        request.pipe(proxyRequest);
        const proxyResponse = await responsePromise;
        const { headers: proxyHeaders, statusCode } = proxyResponse;
        response.writeHead(statusCode, proxyHeaders);
        proxyResponse.pipe(response);
    } catch (e) {
        socket.destroy();
    }
}
