/* eslint-disable no-console */
/* eslint-disable func-names */
(function () {
  fetch('/getBacklog')
    .then(res => res.json())
    .then((backlog) => {
      let bugSPs = 0;
      let storySPs = 0;
      backlog.forEach((story) => {
        if (story.typeName === 'Bug') {
          bugSPs += 1;
        } else {
          storySPs += 1;
        }
      });
      $('#backlogStoriesCount').html(storySPs);
      $('#backlogBugsCount').html(bugSPs);
    })
    .catch((err) => {
      console.log(err);
    });

  fetch('/getSprintsData')
    .then(res => res.json())
    .then((data) => {
      $('.lds-circle').hide();
      const htmlString = `
      <thead>
      <tr>
        <th scope="col"></th>
        <% data.forEach(function(sprint){ %>
          <th><%= sprint.name %> (<%= sprint.state %>) <br> <%= sprint.startDate %> to <%= sprint.endDate %></th>
        <% }); %>
        <th scope="col">Backlog</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">Stories & Tasks [Story Points]</th>
        <td><%= data[0].stories.count %> [<%= data[0].stories.storyPoints %>] </td>
        <td><%= data[1].stories.count %> [<%= data[1].stories.storyPoints %>] </td>
        <td><%= data[2].stories.count %> [<%= data[2].stories.storyPoints %>] </td>
        <td><span id="backlogStoriesCount">0</span> [N/A] </td>
      </tr>
      <tr>
        <th scope="row">Defects/Bugs [Story Points]</th>
        <td><%= data[0].defects.count %> [<%= data[0].defects.storyPoints %>] </td>
        <td><%= data[1].defects.count %> [<%= data[1].defects.storyPoints %>] </td>
        <td><%= data[2].defects.count %> [<%= data[2].defects.storyPoints %>] </td>
        <td><span id="backlogBugsCount">0</span> [N/A] </td>
      </tr>
    </tbody>
      `;
      const html = ejs.render(htmlString, { data });
      $('.table').html(html);
    })
    .catch((err) => { console.log(err); });
}());
