const axios = require('axios');
const async = require('async');
const logger = require('./logger');
const authorization = require('./auth');

const parent = {
  key: 'EN-114615',
  portfolioItems: [],
  components: []
}
const subTasks = ['Create Test Cases in SILK', 'Analyze', 'Implement', 'Code Review', 'Merge', 'QA'];

function getParentDetails(id) {
  const request = {
    method: 'GET',
    url: `https://jira-dev.polycom.com:8443/rest/api/2/issue/${id}`,
    headers: {
      Authorization: authorization,
    },
  };
  return axios(request);
}

function createSubTask(subTask, callback) {
  const request = {
    method: 'POST',
    url: 'https://jira-dev.polycom.com:8443/rest/api/2/issue',
    data: {
      fields: {
        parent: { key: parent.key },
        project: { id: 10803 }, // 10803 => ENGINEERING
        summary: subTask,
        issuetype: { id: 5 }, // 5 => Sub-Task
        description: '',
        components: parent.components.map(obj => ({ id: obj.id })),
        customfield_11002: parent.portfolioItems.map(obj => ({ id: obj.id })),
      }
    },
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/json',
    },
  };

  logger.info('Sub Task Request Object: ', request);
  callback();
}


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