import { Probot } from "probot";

export = (app: Probot) => {
  app.on("issues.opened", async (context) => {
    const ownerRepoData = await context.repo();
    const issues = await context.octokit.issues.listForRepo({
      ...ownerRepoData,
      creator: context.payload.sender.login 
    })
    if (issues.data.length) {
      const issueComment = context.issue({
        body: `Thanks for opening your ${issues.data.length -1}'th issue!`,
      });
      await context.octokit.issues.createComment(issueComment);
    }
  });

  app.on(["pull_request.merged"], async (context) => {
    if (context.payload.pull_request.milestone == null) {
      const ownerRepoData = await context.repo();
      const mileStoneData = await context.octokit.issues.listMilestones(ownerRepoData);
      const modifiedData = mileStoneData.data.reduce((total, current) => {
        return {
          ...total,
          [current.title.substr(1)]: current.number
        }
      }, {} as {[key: string]: any});
      const versions = Object.keys(modifiedData).map(key => parseFloat(key));
      const earliestVer = Math.min(...versions).toString();
      await context.octokit.issues.update({
        ...ownerRepoData,
        issue_number: context.payload.pull_request.number,
        milestone: `${modifiedData[earliestVer]}`
      })
    }
  });
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};
