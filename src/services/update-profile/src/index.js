'use strict';

const express = require('express');
const bodyParser = require('body-parser');

// These will be lazily loaded when needed.
// Per Cloud Run best practice we should lazily load
// references https://cloud.google.com/run/docs/tips
let repo, updateProfileMW, validationMW, schema;

function updateHandlerMW(req, res, next) {
  repo =
    repo ||
    require('../../../lib/repository/profile-repository')
      .profileRepositoryInstance;
  updateProfileMW = updateProfileMW || require('./update-profile-mw')(repo);
  return updateProfileMW(req, res, next);
}

function validateMW(req, res, next) {
  schema = schema || require('./payload-validations').schema;
  validationMW =
    validationMW || require('../../../lib/mw/payload-validation-mw')(schema);
  return validationMW(req, res, next);
}

// Setup Express Server
const app = express();
app.use(bodyParser.json());

// Generate Route with necessary middleware
app.patch(
  '/profile',
  require('../../../lib/mw/user-mw'),
  require('../../../lib/mw/trace-id-mw'),
  validateMW,
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
