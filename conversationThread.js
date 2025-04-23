import { writeFileSync } from "fs";
import { models } from "./models.js";
import ollama from "ollama";

const largeMessageSeparator = `\n${Array(80).fill("=").join("")}\n`;
const smallMessageSeparator = `\n${Array(3).fill("-").join("")}\n`;
const initialPrompt = `Message #0:
You (${models
  .map((model) => model.name)
  .join(
    ", "
  )}) are all working together in a feedback loop to create a, quirky, interesting, weird, and engaging, website. Respond only with code. Replicate the same code from the previous message, and then add something to it or modify something about it. Also, if instead of code changes you have some high level idea you want the others to implement, then just say that. 
  
  Here is your starting code:
  
 \`\`\`html 
  <!DOCTYPE html>
<html>
  <head>
    <title>RONS.CLUB</title>
  </head>
  <body>
    Hello, World!
  </body>
</html>
\`\`\`

The 100th message will mark the end of the project.
Begin.`;

const history = [{ role: "system", content: initialPrompt }];
const historyLimit = models.length * 100;
(async function go(iteration) {
  writeFileSync(
    `conversation-14-iteration-${iteration}.txt`,
    history
      .map((h) => h.content)
      .reverse()
      .join(largeMessageSeparator),
    "utf8"
  );

  const model = models[iteration % models.length];
  const response = await ollama.chat({
    model: model.name,
    messages: history,
  });
  const output = response.message.content;
  console.log(`output: ${output}`);

  const message = `Message #${iteration + 1}: ${model.name} responds with:
  ${model.postProcess(output)}`;

  history.push({ role: "assistant", content: message });
  if (history.length >= historyLimit) history.pop();

  go(iteration + 1);
})(0, initialPrompt);
