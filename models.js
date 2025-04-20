module.exports = [
  {
    name: "deepseek-r1",
    postProcess: deepseekR1PostProcess,
  },
  { name: "gemma3", postProcess: gemma3PostProcess },
  {
    name: "qwen2.5-coder:3b",
    postProcess: gemma3PostProcess,
  },
  { name: "llama3.2", postProcess: gemma3PostProcess },
];

function cleanText(text) {
  return (
    text
      .replace(/\u200B/g, "") // Remove zero-width spaces
      .replace(/\u00A0/g, " ") // Convert non-breaking spaces to normal spaces
      // .replace(/\s+/g, " ") // Normalize multiple spaces/newlines
      .trim()
  );
}

function grabSpanOfFirstAndLastCurlyBraces(text) {
  const index1 = text.indexOf("[");
  const index2 = text.lastIndexOf("]") + 1;
  const jsonOutput = text.slice(index1, index2);
  return jsonOutput;
}

function access(obj, path) {
  return path.reduce((acc, key) => acc[key], obj);
}

function gemma3PostProcess(text) {
  const jsonOutput = grabSpanOfFirstAndLastCurlyBraces(cleanText(text));
  return JSON.parse(jsonOutput);
}

function deepseekR1PostProcess(text) {
  function removeBeforeThinkEnd(text) {
    text = cleanText(text);
    return text.replace(/[\s\S]*<\/think>\n?/, "").trim();
  }
  const preOutput = removeBeforeThinkEnd(text);
  const output = grabSpanOfFirstAndLastCurlyBraces(preOutput);
  const jsonOutput = JSON.parse(output);
  return jsonOutput;
}
