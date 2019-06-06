import listener from './listener';

import Koa = require('koa');

const PORT = 42926;
const app = new Koa();
app.use(listener);

app.listen(PORT);
