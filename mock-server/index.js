/*
 * Mock REST API used during development (`npm run dev` starts it together with Vite).
 * Data lives in mock-server/data/*.json and is created from mock-server/seed on first start.
 */
'use strict';

var createApp = require('./app');

var port = Number(process.env.API_PORT || 4000);
var app = createApp({ logRequests: true });

app.listen(port, function () {
  console.log('Mock API listening on http://localhost:' + port + '/api');
});
