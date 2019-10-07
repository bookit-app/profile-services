'use strict';

const {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  OK
} = require('../../lib/constants').statusCodes;
const { clone, isEmpty } = require('lodash');
const {
  profiledIdMissing,
  systemError
} = require('../../lib/constants').errors;
const { extractTraceIdFromHeader } = require('../../lib/util');

const logger = require('../../lib/util/logger');

module.exports = (profileRepository) => {
  if (isEmpty(profileRepository)) {
    throw new Error('Dependencies not provided.');
  }

  const queryProfile = async (req, res) => {
    const trace = extractTraceIdFromHeader(req);
    if (isEmpty(req.query) || isEmpty(req.query.profileId)) {
      return rejectRequest(res, trace);
    }

    await processRequest(res, profileRepository, req.query.profileId, trace);
  };

  return {
    queryProfile
  };
};

async function processRequest(res, profileRepository, profileId, trace) {
  try {
    const profile = await profileRepository.findByProfileId(profileId);

    if (isEmpty(profile)) {
      res.sendStatus(NOT_FOUND);
    } else {
      res.status(OK);
      res.send(profile);
    }
  } catch (err) {
    const response = clone(systemError);
    response.technicalError = err.message;
    response.traceId = trace;
    logger.error(response);
    res.status(INTERNAL_SERVER_ERROR);
    res.send(response);
  }
}

async function rejectRequest(res, trace) {
  res.status(BAD_REQUEST);
  const response = clone(profiledIdMissing);
  response.traceId = trace;
  logger.error(response);

  res.send(profiledIdMissing);
  return;
}
