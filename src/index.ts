import { Probot } from "probot";

export = (app: Probot) => {
  app.on("issues.opened", async (context) => {
    const ownerRepoData = await context.repo();
    const issues = await context.octokit.issues.listForRepo({
      ...ownerRepoData,
      creator: context.payload.sender.login 
    });
    if (issues.data.filter((obj) => !('pull_request' in obj)).length === 1) {
      const issueComment = context.issue({
        body: "Nice work opening your first issue!",
      });
      await context.octokit.issues.createComment(issueComment);
    }
  });

  app.on(["pull_request"], async(context) => {
    const ownerRepoData = await context.repo();
    const labels = await context.octokit.issues.listLabelsForRepo({
      ...ownerRepoData
    });
    if (context.payload.pull_request.draft) {
      const labelString = labels.data
        .filter((labelObj: any) => labelObj["name"] === "pr.OnGoing")
        .map((labelObj: any) => labelObj["name"]);
      await context.octokit.issues.setLabels({
        ...ownerRepoData,
        issue_number: context.payload.pull_request.number,
        labels: labelString
      })
    } else {
      const labelString = labels.data
        .filter((labelObj: any) => labelObj["name"] === "pr.ToReview")
        .map((labelObj: any) => labelObj["name"]);
      await context.octokit.issues.setLabels({
        ...ownerRepoData,
        issue_number: context.payload.pull_request.number,
        labels: labelString
      })
    }
    // console.log(context.payload.pull_request.labels);
    // console.log(context.payload.pull_request.draft);
    // console.log(labels);
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
