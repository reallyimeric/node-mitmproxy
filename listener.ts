import { Context } from 'koa';
import fetch from 'node-fetch';
import { getOriginalDst } from 'node-getsockopt';
import { promisify } from 'util';

const getOriginalDstAsync = promisify(getOriginalDst);

export default async function listener(ctx: Context, next): Promise<void> {
    const { req, request } = ctx;
    const { socket } = req;
    const addrInfo = await getOriginalDstAsync(socket);
    const { path, headers } = request;
    // const init = {
    //     method: req.method,
    //     headers,
    //     keepalive: true,
    //     body: ,
    // };
    // const serverRes = await fetch(`http://${addrInfo.address}:${addrInfo.port}${path}`, init);
    await next();
    // ctx.
}
