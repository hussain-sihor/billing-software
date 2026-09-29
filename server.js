const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');

const productsRouter = require('./routes/products');
const partiesRouter = require('./routes/parties');
const documentsRouter = require('./routes/documents');
const settingsRouter = require('./routes/settings');

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.use('/api/products', productsRouter);
app.use('/api/parties', partiesRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/settings', settingsRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Serve the billing app frontend.
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Central error handler — always returns JSON, never a stack-trace page.
app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`[server] Bellavo Billing running at http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('[db] Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
