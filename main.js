const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const models = require("./models");
const prompt = fs.readFileSync("./prompt.txt", "utf8");

const jsonFormat = JSON.stringify({
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        question: "string",
        choices: {
          type: "array",
          items: { type: "string" },
        },
        answer: "string",
      },
    },
  },
  required: ["questions"],
});

let metaData = {};

for (const { name: model, postProcess } of models) {
  // Create output file path
  const outputFile = path.join(
    __dirname,
    "output",
    "quiz_creation",
    "quizzes",
    model
  );

  console.log("Starting process...");

  let retries = 0;
  while (retries < 10) {
    try {
      createQuiz(model, outputFile, postProcess);
      break;
    } catch (error) {
      console.error("Error executing command:", error.message);
      retries++;
    }
  }
  metaData[model] = {
    retries,
  };
}

fs.writeFileSync(
  path.join(__dirname, "output", "quiz_creation", "metadata.json"),
  JSON.stringify(metaData, null, 2)
);

function createQuiz(model, outputFile, postProcess) {
  const args = ["run", model, prompt, `format=${jsonFormat}`];
  // console.log("Running command:", "ollama", args.join(" "));

  const output = execSync(
    `ollama run ${model} "${prompt}" format='${jsonFormat}'`
  ).toString();
  // console.log(`model ${model} output: ${output}`);
  const questions = postProcess(output);
  fs.writeFileSync(outputFile + ".json", JSON.stringify(questions, null, 2));

  return output;
}
