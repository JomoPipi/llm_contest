const { execSync } = require("child_process");
const fs = require("fs");
const models = require("../models");

const jsonFormat = JSON.stringify({
  type: "array",
  items: { type: "string" },
});

process.on("message", (data) => {
  const { modelIndex, outputFile, prompt } = data;
  const model = models[modelIndex];
  try {
    const output = execSync(
      `ollama run ${model.name} "${prompt}" format='${jsonFormat}'`
    ).toString();

    // try
    const answers = model.postProcess(output);
    const data = JSON.stringify(answers);

    // process.send({ answers });
    try {
      fs.writeFileSync(outputFile + ".json", data);
    } catch (error) {
      console.error(`Error writing to ${outputFile + ".json"}:`, error);
      process.send({
        success: false,
        error: `Error (again)for ${model.name}: ${error.message}.
        The data was ${data}. answers = ${answers}`,
      });
    }

    process.send({ success: true });
  } catch (error) {
    process.send({
      success: false,
      error: `Error for Ronald: ${error.message}`,
    });
  }
});
