const axios = require('axios');
const logger = require('./logger');
const config = require('./config');

function getAllSprints(boardId) {
  const request = {
    method: 'GET',
    url: `${config.jiraUrl}/rest/agile/1.0/board/${boardId}/sprint`,
    headers: {
      Authorization: config.authHeader,
    },
  };
  return axios(request);
}

function createSubTask(parentStory, subTask, callback) {
  const parent = parentStory || {
    key: 'EN-114615',
    portfolioItems: [],
    components: [],
  };

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
      },
    },
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/json',
    },
  };

  logger.info('Sub Task Request Object: ', request);
  callback();
}

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

function getSprintReport(boardId, sprintId) {
  const request = {
    method: 'GET',
    url: `${config.jiraUrl}/rest/greenhopper/1.0/rapid/charts/sprintreport?rapidViewId=${boardId}&sprintId=${sprintId}`,
    headers: {
      Authorization: config.authHeader,
    },
  };
  return axios(request);
}

function getScopeChangeBurndownChart(boardId, sprintId) {
  const request = {
    method: 'GET',
    url: `${config.jiraUrl}/rest/greenhopper/1.0/rapid/charts/scopechangeburndownchart.json?rapidViewId=${boardId}&sprintId=${sprintId}`,
    headers: {
      Authorization: config.authHeader,
    },
  };
  return axios(request);
}

getAllSprints(10792)
  .then((result) => {
    const sprints = (result.data.values);
    sprints.forEach((sprint) => {
      if (sprint.state === 'active') {
        logger.info(`Active Sprint-> ID:${sprint.id}, Name: ${sprint.name}`);
        logger.info(`Start: ${sprint.startDate}`);
        logger.info(`End: ${sprint.endDate}`);
      }
    });
  })
  .catch((err) => {
    logger.error(err);
  });
