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

app.get('/abcd', (req, res, next) => {
  const viewData = {
    name: jsonData.sprint.name.split('Harman ')[1],
    stories: {
      count: 0,
      storyPoints: 0,
    },
    defects: {
      count: 0,
      storyPoints: 0,
    },
  };

  jsonData.contents.completedIssues.forEach((item) => {
    switch (item.typeName) {
      case 'Bug':
        viewData.defects.count += 1;
        viewData.defects.storyPoints += viewData.defects.storyPoints;
        break;
      case 'Story':
        viewData.stories.count += 1;
        viewData.stories.storyPoints += viewData.stories.storyPoints;
        break;
      case 'Task':
        viewData.stories.count += 1;
        viewData.stories.storyPoints += viewData.stories.storyPoints;
        break;
      default:
        break;
    }
  });
  res.render('index.ejs', viewData);
  next();
});

app.get('/', (req, res, next) => {
  jiraApi.getMonthlyReport(res);
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
