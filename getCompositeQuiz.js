const fs = require("fs");
const path = require("path");

let _quiz;
module.exports = function getCompositeQuiz() {
  if (_quiz) return _quiz;
  const quizzesDir = path.join(__dirname, "quiz_creation", "quizzes");
  const quizFiles = fs.readdirSync(quizzesDir);
  const compositeQuiz = quizFiles.reduce((allQuizzes, file) => {
    const quizPath = path.join(quizzesDir, file);
    const quizQuestions = JSON.parse(fs.readFileSync(quizPath, "utf8"));
    return [...allQuizzes, ...quizQuestions];
  }, []);
  _quiz = compositeQuiz;
  return compositeQuiz;
};
