const express = require('express');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const requestLogger = require('./src/middlewares/requestLogger');
const notFound = require('./src/middlewares/notFound');
const errorHandler = require('./src/middlewares/errorHandler');

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(requestLogger);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use(require('./src/routes/health.routes')); // GET /health
app.use('/api', require('./src/routes')); // toàn bộ API
app.use('/api', notFound); // API sai đường dẫn -> 404 JSON

// Phục vụ React đã build (chỉ khi đã chạy `npm run build`)
const dist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { maxAge: '7d', index: false }));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use(errorHandler);
module.exports = app;
