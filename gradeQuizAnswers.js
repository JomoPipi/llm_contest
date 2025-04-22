const models = require("./models");
const fs = require("fs");
const path = require("path");
const outputDir = path.join(__dirname, "output");
const getCompositeQuiz = require("./getCompositeQuiz");
const compositeQuiz = getCompositeQuiz();
const answerKey = compositeQuiz.map((q) => q.answer);

module.exports = async function gradeQuizAnswers() {
  fs.writeFileSync(
    path.join(outputDir, "grades.json"),
    JSON.stringify(
      models.map((model) => {
        const answers = JSON.parse(
          fs.readFileSync(path.join(outputDir, `${model.name}.json`), "utf8")
        );
        const simpleFormat = typeof answers[0] === "string";
        const totalAnswers = answers.length;
        const correctAnswers = simpleFormat
          ? answers.filter((answer, i) => answer === answerKey[i])
          : answers.filter((answer, i) => answer.answer === answerKey[i]);
        // if (correctAnswers === "unknown")
        //   throw `improperly formatted answer: ${answers[0]}`;
        const accuracy = correctAnswers.length / totalAnswers;
        return [model.name, accuracy];
      }),
      null,
      2
    )
  );
};
