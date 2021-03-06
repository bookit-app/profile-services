'use strict';

const express = require('express');
const bodyParser = require('body-parser');

// These will be lazily loaded when needed.
// Per Cloud Run best practice we should lazily load
// references https://cloud.google.com/run/docs/tips
let profileRepo, updateMW;

function updateHandlerMW(req, res, next) {
  profileRepo =
    profileRepo ||
    require('../../../lib/repository/profile-repository')
      .profileRepositoryInstance;
  updateMW = updateMW || require('./profile-update-mw')(profileRepo);
  return updateMW(req, res, next);
}

// Setup Express Server
const app = express();
app.use(bodyParser.json());

// Generate Route with necessary middleware
app.post(
  '/',
  require('../../../lib/mw/trace-id-mw'),
  require('../../../lib/mw/convert-pubsub-message-mw'),
  updateHandlerMW,
  require('./success-mw')
);

app.use(require('../../../lib/mw/error-handling-mw'));

// Start up the server and listen on the provided port
app.listen(process.env.PORT, err => {
  if (err) {
    console.log(`Server failed to start due to ${err.message}`);
    return;
  }
  console.log(`Server is running on port ${process.env.PORT}`);
});
