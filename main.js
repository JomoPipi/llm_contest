const createQuizzesInParallel = require("./quiz_creation/createQuizzesInParallel");
const answerQuizzesInParallel = require("./answering/answerQuizzesInParallel");

function millisecondsToSeconds(ms) {
  return Math.ceil(ms / 1000);
}

const tasks = [
  // createQuizzesInParallel,
  answerQuizzesInParallel,
];

tasks.reduce((promise, task) => {
  return promise.then(() => {
    const now = Date.now();
    return task()
      .catch(console.error)
      .then(() => {
        console.log(
          `Total time taken: ${millisecondsToSeconds(Date.now() - now)}s`
        );
      });
  });
}, Promise.resolve());
