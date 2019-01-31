/* eslint-disable no-unused-vars */
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const createError = require('http-errors');
const jiraApi = require('./jiraApi');
const logger = require('./logger');
const jsonData = require('./logs/sprintReport.json');
const config = require('./config');

const app = express();
// view engine settings
app.set('views', path.join(__dirname, 'public/views'));
app.set('view engine', 'ejs');

app.use(morgan('combined', {
  stream: logger.stream,
}));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json({ limit: '10mb', extended: true }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get('/favicon.ico', (req, res) => res.sendStatus(204));

app.get('/', (req, res, next) => {
  res.render('index.ejs');
});

app.get('/getSprintsData', async (req, res, next) => {
  let sprints;
  const viewData = [];
  try {
    sprints = await jiraApi.getAllSprints(config.boardId);
    sprints = sprints.data.values.filter(sprint => (
      ((sprint.name.indexOf('Harman') > -1) && (sprint.state !== 'future'))
    ));
    sprints.splice(0, sprints.length - 3);
    const promises = [];
    sprints.forEach((sprint) => {
      promises.push(jiraApi.getSprintReport(sprint.originBoardId, sprint.id));
    });
    try {
      const responses = await Promise.all(promises);
      responses.forEach((response) => {
        const sprintMeta = {
          name: response.data.sprint.name.split('Harman ')[1],
          state: response.data.sprint.state,
          startDate: jiraApi.getDateInReportFormat(response.data.sprint.startDate),
          endDate: jiraApi.getDateInReportFormat(response.data.sprint.endDate),
          stories: {
            count: 0,
            storyPoints: 0,
          },
          defects: {
            count: 0,
            storyPoints: 0,
          },
        };

        if (response.data.sprint.state !== 'CLOSED') {
          response.data.contents.issuesNotCompletedInCurrentSprint.forEach((item) => {
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
        }

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
    res.send(viewData);
  } catch (error) {
    logger.error(`Error in getting sprints: ${error.message}`);
  }
});

app.get('/getBacklog', async (req, res, next) => {
  try {
    const data = await jiraApi.getBacklogData();
    const { sprints, issues } = data.data;
    const sprintIssuesIds = [];
    sprints.forEach((sprint) => {
      sprintIssuesIds.push(...sprint.issuesIds);
      logger.info(sprint.id);
    });
    const backlog = issues.filter(issue => !sprintIssuesIds.includes(issue.id));
    res.send(backlog);
  } catch (error) {
    logger.error(error.message);
    if (error.response && error.response.status) {
      res.status(error.response.status);
    } else {
      res.status(500);
    }
    res.send(error.message);
  }
});

app.use((req, res, next) => {
  logger.error('404 not found error');
  next(createError(404));
});

// error handler
app.use((err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // add this line to include logger logging
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
