import { getOriginalDst, SocketAddress } from 'node-getsockopt';
import { promisify } from 'util';
import { IncomingMessage, ServerResponse } from 'http';
import { PassThrough } from 'stream';
import { Socket } from 'net';
import {
    addListenerForClientRequest,
    convertIPAddressFamily,
    shouldRedirect, isStatusOk,
} from './util';
import { MOCK_HOST, MOCK_PORT } from './env';

import http = require('http');

const getOriginalDstAsync = promisify<Socket, SocketAddress>(getOriginalDst);

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
        family: convertIPAddressFamily(family),
        headers,
        hostname,
        method,
        path: url,
        port,
        protocol,
    });

    try {
        const proxyResponsePromise = addListenerForClientRequest(proxyRequest);
        const backup = new PassThrough();
        request.pipe(proxyRequest);
        request.pipe(backup);
        const proxyResponse = await proxyResponsePromise;
        const { headers: proxyHeaders, statusCode } = proxyResponse;
        if (shouldRedirect(statusCode as number)) {
            // if should redirect
            const mockRequest = http.request({
                agent: false,
                family: convertIPAddressFamily(family),
                headers,
                hostname: MOCK_HOST,
                method,
                path: url,
                port: MOCK_PORT,
                protocol,
            });
            try {
                const mockResponsePromise = addListenerForClientRequest(mockRequest);
                backup.pipe(mockRequest);
                const mockResponse = await mockResponsePromise;
                const { headers: mockHeaders, statusCode: mockStatusCode } = mockResponse;
                if (isStatusOk(mockStatusCode as number)) {
                    response.writeHead(mockStatusCode as number, mockHeaders);
                    proxyResponse.pipe(response);
                } else {
                    // if mock not ok
                    throw new Error('mock failed');
                }
            } catch (e) {
                // if failed on mock
                response.writeHead(statusCode as number, proxyHeaders);
                proxyResponse.pipe(response);
            }
        } else {
            // if should not redirect
            response.writeHead(statusCode as number, proxyHeaders);
            proxyResponse.pipe(response);
        }
    } catch (e) {
        // if failed on proxy
        socket.destroy();
    }
}
