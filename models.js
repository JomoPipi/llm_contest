module.exports = [
  {
    name: "deepseek-r1",
    postProcess: deepseekR1PostProcess,
  },
  { name: "gemma3", postProcess: gemma3PostProcess },
];

function grabSpanOfFirstAndLastCurlyBraces(text) {
  const index1 = text.indexOf("{");
  const index2 = text.lastIndexOf("}") + 1;
  const jsonOutput = text.slice(index1, index2);
  return jsonOutput;
}

function access(obj, path) {
  return path.reduce((acc, key) => acc[key], obj);
}

function gemma3PostProcess(text) {
  const jsonOutput = grabSpanOfFirstAndLastCurlyBraces(text);
  return JSON.parse(jsonOutput).questions;
}

function deepseekR1PostProcess(text) {
  function cleanText(text) {
    return (
      text
        .replace(/\u200B/g, "") // Remove zero-width spaces
        .replace(/\u00A0/g, " ") // Convert non-breaking spaces to normal spaces
        // .replace(/\s+/g, " ") // Normalize multiple spaces/newlines
        .trim()
    );
  }
  function removeBeforeThinkEnd(text) {
    text = cleanText(text);
    return text.replace(/[\s\S]*<\/think>\n?/, "").trim();
  }
  const preOutput = removeBeforeThinkEnd(text);
  const output = grabSpanOfFirstAndLastCurlyBraces(preOutput);
  const jsonOutput = JSON.parse(output);
  let node = jsonOutput;
  const pathsToVisit = Object.keys(jsonOutput).map((k) => [k]);
  while (pathsToVisit.length > 0) {
    const path = pathsToVisit.pop();
    const key = path[path.length - 1];
    const data = access(jsonOutput, path);
    if (key === "questions") {
      node = data;
      break;
    }
    pathsToVisit.push(...Object.keys(data).map((k) => [...path, k]));
  }
  return node;
}
