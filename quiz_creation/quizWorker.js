const { execSync } = require("child_process");
const fs = require("fs");
const models = require("../models");

const jsonFormat = JSON.stringify({
  type: "array",
  items: {
    question: "string",
    choices: {
      type: "array",
      items: { type: "string" },
    },
    answer: "string",
  },
});

process.on("message", (data) => {
  const { modelIndex, outputFile, prompt } = data;
  const model = models[modelIndex];
  let output, questions;

  try {
    output = execSync(
      `ollama run ${model.name} "${prompt}" format='${jsonFormat}'`
    ).toString();
  } catch (error) {
    process.send({
      success: false,
      error: "Error with execSync in quizWorker: " + error.message,
    });
    return;
  }
  try {
    // fs.writeFileSync(outputFile + ".txt", output);

    // return;
    // if (model.name.startsWith("qwen")) {
    //   process.send({ output });
    //   return;
    // }

    questions = model.postProcess(output);
  } catch (error) {
    process.send({
      success: false,
      error: `Error in postProcess (output = ${output}) : ` + error.message,
    });
  }
  try {
    fs.writeFileSync(outputFile + ".json", JSON.stringify(questions, null, 2));

    process.send({ success: true });
  } catch (error) {
    process.send({
      success: false,
      error: "Error in writeFileSync:" + error.message,
    });
  }
});

// The original function is kept for reference or individual use
function createQuiz(model, outputFile, postProcess) {
  const output = execSync(
    `ollama run ${model} "${prompt}" format='${jsonFormat}'`
  ).toString();
  const questions = postProcess(output);
  fs.writeFileSync(outputFile + ".json", JSON.stringify(questions, null, 2));
}
