const logger = require('./logger');
const config = require('./config');
const { getAllSprints, getSprintReport } = require('./jiraApi');

async function getMonthlyReport(res) {
  let sprints;
  try {
    const viewData = [];
    sprints = await getAllSprints(config.boardId);
    sprints = sprints.filter(sprint => (((sprint.name.indexOf('Harman') > -1) && (sprint.state !== 'future')))).splice(0, sprints.length - 3);
    const promises = [];
    sprints.forEach((sprint) => {
      promises.push(getSprintReport(sprint.originBoardId, sprint.id));
    });
    try {
      const sprintReports = await Promise.all(promises);
      sprintReports.forEach((report) => {
        const sprintMeta = {
          name: report.sprint.name.split('Harman ')[1],
          stories: {
            count: 0,
            storyPoints: 0,
          },
          defects: {
            count: 0,
            storyPoints: 0,
          },
        };
        report.contents.completedIssues.forEach((item) => {
          switch (item.typeName) {
            case 'Bug':
              sprintMeta.defects.count += 1;
              sprintMeta.defects.storyPoints += sprintMeta.defects.storyPoints;
              break;
            case 'Story':
              sprintMeta.stories.count += 1;
              sprintMeta.stories.storyPoints += sprintMeta.stories.storyPoints;
              break;
            case 'Task':
              sprintMeta.stories.count += 1;
              sprintMeta.stories.storyPoints += sprintMeta.stories.storyPoints;
              break;
            default:
              break;
          }
        });
        viewData.push(sprintMeta);
      });
    }
    catch (error) {
      logger.error(`Error in sprint reports: ${error.message}`);
    }
    res.send(viewData);
  }
  catch (error) {
    logger.error(`Error in getting sprints: ${error.message}`);
  }
}
