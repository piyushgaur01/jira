const axios = require('axios');
const logger = require('./logger');
const config = require('./config');

const subTasks = ['Create Test Cases in SILK', 'Analyze', 'Implement', 'Code Review', 'Merge', 'QA'];

function startLog() {
  logger.info('****************************************');
  logger.info('Sub Tasks creation in progress!');
  logger.info('****************************************');
}

function endLog() {
  logger.info('****************************************');
  logger.info('Sub Tasks created successfully!');
  logger.info('****************************************');
}

function createSubTask(parent, subTask, callback) {
  startLog();

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
      Authorization: config.authHeader,
    },
  };
  return axios(request);
}

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

async function getMonthlyReport(res) {
  let sprints;
  const viewData = [];
  try {
    sprints = await getAllSprints(config.boardId);
    sprints = sprints.data.values.filter(sprint => (
      ((sprint.name.indexOf('Harman') > -1) && (sprint.state !== 'future'))
    ));
    sprints.splice(0, sprints.length - 3);
    const promises = [];
    sprints.forEach((sprint) => {
      promises.push(getSprintReport(sprint.originBoardId, sprint.id));
    });
    try {
      const responses = await Promise.all(promises);
      responses.forEach((response) => {
        const sprintMeta = {
          name: response.data.sprint.name.split('Harman ')[1],
          state: response.data.sprint.state,
          stories: {
            count: 0,
            storyPoints: 0,
          },
          defects: {
            count: 0,
            storyPoints: 0,
          },
        };
        response.data.contents.completedIssues.forEach((item) => {
          switch (item.typeName) {
            case 'Bug':
              sprintMeta.defects.count += 1;
              sprintMeta.defects.storyPoints += item.currentEstimateStatistic.statFieldValue.value;
              break;
            case 'Story':
              sprintMeta.stories.count += 1;
              sprintMeta.stories.storyPoints += item.currentEstimateStatistic.statFieldValue.value;
              break;
            case 'Task':
              sprintMeta.stories.count += 1;
              sprintMeta.stories.storyPoints += item.currentEstimateStatistic.statFieldValue.value;
              break;
            default:
              break;
          }
        });
        viewData.push(sprintMeta);
      });
    } catch (error) {
      logger.error(`Error in sprint reports: ${error.message}`);
    }
    res.render('index.ejs', { data: viewData });
  } catch (error) {
    logger.error(`Error in getting sprints: ${error.message}`);
  }
}

module.exports = {
  getAllSprints, getMonthlyReport,
};
// getAllSprints(config.boardId)
//   .then((result) => {
//     const sprints = (result.data.values);
//     sprints.forEach((sprint) => {
//       if (sprint.state === 'active') {
//         logger.info(`Active Sprint-> ID:${sprint.id}, Name: ${sprint.name}`);
//         logger.info(`Start: ${sprint.startDate}`);
//         logger.info(`End: ${sprint.endDate}`);
//       }
//     });
//   })
//   .catch((err) => {
//     logger.error(err);
//   });
