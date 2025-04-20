const fs = require("fs");
const path = require("path");
const models = require("../models");
const prompt = fs.readFileSync("./quiz_creation/prompt.txt", "utf8");
const { fork } = require("child_process");

module.exports = async function createQuizzesInParallel() {
  // Fork a process for each model
  const [promises, metadata] = models.reduce(
    ([promises, metadata], model, modelIndex) => {
      const outputFile = path.join(__dirname, "quizzes", model.name);

      console.log(`Starting process for model: ${model.name}...`);

      // Create a promise for this worker
      const workerPromise = new Promise((resolve, reject) => {
        let retries = 0;
        const maxRetries = 8;
        const startTime = Date.now();
        const getElapsedSeconds = () =>
          Math.ceil((Date.now() - startTime) / 1000);

        function startWorker() {
          const worker = fork(path.join(__dirname, "quizWorker.js"));

          worker.on("message", (message) => {
            // if (message.output) {
            //   fs.writeFileSync(outputFile + ".txt", message.output, "utf8");
            //   resolve();
            //   return;
            // }
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

          // Send data to worker
          worker.send({
            modelIndex,
            outputFile,
            prompt: prompt, //+ (model.promptSuffix || ""),
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
    path.join(__dirname, "quiz_creation_metadata.json"),
    JSON.stringify(
      { ...metadata, created: Date().toString().split(" GMT")[0] },
      null,
      2
    )
  );

  console.log("All quiz generations completed!");
};
