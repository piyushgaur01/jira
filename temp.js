const async = require('async');
const logger = require('./logger');
const config = require('./config');


const parent = parentStory || {
  key: 'EN-114615',
  portfolioItems: [],
  components: [],
};

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
