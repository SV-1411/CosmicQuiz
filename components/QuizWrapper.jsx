import React, { useEffect, useState } from "react";
import CosmicQuiz from "./CosmicQuiz";
import { questionBank } from "./questionBank";
import CongratulationsScreen from "./cosmicEnd"; // 🔹 Import the new component

const QuizWrapper = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizFinished, setQuizFinished] = useState(false); // 🔹 New state for conditional rendering
  const [finalScore, setFinalScore] = useState(0); // 🔹 New state to store the final score

  useEffect(() => {
    // Shuffle and pick 10 questions
    const shuffled = [...questionBank].sort(() => Math.random() - 0.5);
    setQuestions(shuffled.slice(0, 10));
  }, []);

  const handleAnswerSelect = (answerId) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: answerId,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleSubmit = () => {
    let correctCount = 0;
    
    // Calculate the number of correct answers
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswerId) {
        correctCount++;
      }
    });

    // 🔹 Update the state with the final score
    setFinalScore(correctCount);
    
    // 🔹 Set the quizFinished state to true to trigger rendering of the congratulations screen
    setQuizFinished(true);

    console.log("Total correct answers:", correctCount);
    console.log("Total answered questions:", Object.keys(selectedAnswers).length);
  };
  
  // 🔹 Return the CongratulationsScreen if the quiz is finished
  if (quizFinished) {
    return (
      <CongratulationsScreen 
        score={finalScore}
        totalQuestions={questions.length}
        // You can add onReviewAnswers and onReturnHome handlers here
      />
    );
  }

  // 🔹 Otherwise, return the CosmicQuiz component
  return (
    <>
      {questions.length > 0 && (
        <CosmicQuiz
          questions={questions}
          currentQuestionIndex={currentQuestionIndex}
          selectedAnswer={selectedAnswers[currentQuestionIndex]}
          onAnswerSelect={handleAnswerSelect}
          onNext={handleNext}
          onSubmit={handleSubmit}
          totalQuestions={questions.length}
        />
      )}
    </>
  );
};

export default QuizWrapper;