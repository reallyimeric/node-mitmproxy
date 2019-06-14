import { IncomingMessage, ClientRequest } from 'http';

export const promisifyClientRequest = (
    request: ClientRequest,
): Promise<IncomingMessage> => new Promise(
    (resolve, reject): void => {
        request.on('response', (proxyResponse: IncomingMessage): void => {
            resolve(proxyResponse);
        });
        request.on('error', (err): void => {
            reject(err);
        });
        request.on('abort', (): void => {
            reject(new Error('aborted'));
        });
        request.on('timeout', (): void => {
            request.abort();
        });
    },
);

export const shouldRedirect = (statusCode: number): boolean => {
    // not support
    if (statusCode === 101) return false;
    if (statusCode >= 100 && statusCode < 200) return false;
    if (statusCode >= 200 && statusCode < 300) return false;
    if (statusCode >= 300 && statusCode < 400) return false;
    if (statusCode >= 400 && statusCode < 500) return true;
    if (statusCode >= 500 && statusCode < 600) return true;
    throw new Error('invalid code');
};

export const isStatusOk = (statusCode: number): boolean => {
    if (statusCode >= 100 && statusCode < 200) return true;
    if (statusCode >= 200 && statusCode < 300) return true;
    if (statusCode >= 300 && statusCode < 400) return true;
    if (statusCode >= 400 && statusCode < 500) return false;
    if (statusCode >= 500 && statusCode < 600) return false;
    throw new Error('invalid code');
};
