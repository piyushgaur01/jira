const async = require('async');
const logger = require('./logger');
const authorization = require('./config');


const subTasks = ['Create Test Cases in SILK', 'Analyze', 'Implement', 'Code Review', 'Merge', 'QA'];

function startLog() {
  logger.info('****************************************');
  logger.info(`Parent Key: ${parent.key}`);
  logger.info(`Sub Tasks: ${subTasks}`);
  logger.info('****************************************');
}

function endLog() {
  logger.info('****************************************');
  logger.info('Sub Tasks created successfully!');
  logger.info('****************************************');
}


startLog();
getParentDetails(parent.key)
  .then((result) => {
    logger.info(`Status: ${result.status} | Parent Key: ${result.data.key} | Parent id: ${result.data.id}`);
    parent.components = result.data.fields.components;
    parent.portfolioItems = result.data.fields.customfield_11002;
    async.eachSeries(subTasks, (subTask, cb) => {
      setTimeout(createSubTask, 300, subTask, cb);
    }, endLog);
  })
  .catch((err) => {
    logger.error('Error while fetching parent details: ', err.response.data);
  });
