const fs = require("fs");
const path = require("path");
const models = require("../models");
const promptTemplate = fs.readFileSync(
  "./answering/prompt_template.txt",
  // "./quiz_creation/prompt.txt",
  "utf8"
);
const getCompositeQuiz = require("../getCompositeQuiz");

const { fork } = require("child_process");

function removeAnswers(quiz) {
  return quiz.map((q) => {
    const { answer, ...rest } = q;
    return rest;
  });
}
module.exports = async function answerQuizzesInParallel() {
  const quiz = getCompositeQuiz();

  // const prePrompt = JSON.stringify(removeAnswers(quiz), null, 2);

  const prePrompt = promptTemplate.replace(
    "{{{QUIZ-DATA}}}",
    JSON.stringify(removeAnswers(quiz), null, 2)
  );

  // Escape quotes in the prompt to prevent shell injection/parsing issues
  const prompt = prePrompt
    .replace(/"/g, '\\"') // Escape all double quotes
    .replace(/'/g, "\\'") // Escape all single quotes
    .replace(/\n/g, "\\\n") // Escape all newlines
    .replace(/\$/g, "\\$") // Escape $ to prevent variable expansion
    .replace(/`/g, "\\`"); // Escape backticks
  //   // Get rid of stuff, fuck it.
  //   .replaceAll("\n", ". ")
  //   .replaceAll("```", "")
  //   .replaceAll("```json", "")
  //   .replaceAll("```python", "")
  //   .replaceAll("'", "")
  //   .replaceAll('"', "");'

  // const prompt = prePrompt;
  // console.log({ prompt });

  // fs.writeFileSync(path.join(process.cwd(), "answering/prompt.txt"), prePrompt);
  // const prompt = fs.readFileSync(
  //   path.join(process.cwd(), "answering/prompt.txt"),
  //   "utf8"
  // );

  // Fork a process for each model
  const [promises, metadata] = models.reduce(
    ([promises, metadata], model, modelIndex) => {
      const outputFile = path.join(process.cwd(), "output", model.name);

      console.log(`Starting process for model: ${model.name}...`);

      // Create a promise for this worker
      const workerPromise = new Promise((resolve, reject) => {
        let retries = 0;
        const maxRetries = 3;
        const startTime = Date.now();
        const getElapsedSeconds = () =>
          Math.ceil((Date.now() - startTime) / 1000);

        function startWorker() {
          const worker = fork(path.join(__dirname, "answerWorker.js"));

          worker.on("message", (message) => {
            if (message.answers) {
              console.log({ model: model.name, answers: message.answers });
              return;
            }
            if (message.success) {
              metadata[model.name] = {
                retries,
                duration: getElapsedSeconds(),
              };
              resolve();
            } else if (retries < maxRetries) {
              console.error(`Error with model ${model.name}:`, message.error);
              retries++;
              console.log(`Retrying (${retries}/${maxRetries})...`);
              startWorker();
            } else {
              metadata[model.name] = {
                retries,
                error: message.error,
                duration: getElapsedSeconds(),
              };
              resolve(); // Resolve anyway to continue with other models
            }
          });

          worker.on("error", (error) => {
            if (retries < maxRetries) {
              console.error(`Worker error with model ${model.name}:`, error);
              retries++;
              console.log(`Retrying (${retries}/${maxRetries})...`);
              startWorker();
            } else {
              metadata[model.name] = { retries, error: error.message };
              resolve(); // Resolve anyway to continue with other models
            }
          });

          // console.log({ prompt });

          // Send data to worker
          worker.send({
            modelIndex,
            outputFile,
            prompt,
          });
        }

        startWorker();
      });

      return [[...promises, workerPromise], metadata];
    },
    [[], {}]
  );

  // Wait for all workers to finish
  await Promise.all(promises);

  // Save metadata
  fs.writeFileSync(
    path.join(process.cwd(), "answering", "quiz_answering_metadata.json"),
    JSON.stringify(
      { ...metadata, created: Date().toString().split(" GMT")[0] },
      null,
      2
    )
  );

  console.log("All quiz questions answered!");
};

function answerQuiz(quiz, model) {
  const answer = model.answerQuiz(quiz);
  return answer;
}
