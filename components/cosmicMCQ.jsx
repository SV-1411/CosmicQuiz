import React, { useState } from 'react';
import { ChevronLeft, Clock } from 'lucide-react';

const CosmicQuiz = ({ 
  questions = [],
  currentQuestionIndex = 0,
  onAnswerSelect,
  onNext,
  onPrevious,
  onSubmit,
  selectedAnswer = null,
  showTimer = true,
  totalQuestions = 10
}) => {
  const currentQuestion = questions[currentQuestionIndex] || {
    question: "What is the capital of France?",
    options: [
      { id: 'A', text: 'Paris' },
      { id: 'B', text: 'London' },
      { id: 'C', text: 'Berlin' },
      { id: 'D', text: 'Rome' }
    ]
  };

  const progressDots = Array.from({ length: totalQuestions }, (_, i) => (
    <div
      key={i}
      className={`w-2 h-2 rounded-full transition-colors duration-300 ${
        i < currentQuestionIndex + 1 ? 'bg-white' : 'bg-white/30'
      }`}
    />
  ));

  return (
      <div
       className="min-h-screen relative bg-cover bg-center bg-no-repeat"
       style={{ backgroundImage: "url('assets/cosmic-desktop.jpg')" }}
      >

      

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen w-full p-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <ChevronLeft className="absolute top-8 left-8 text-white w-6 h-6 cursor-pointer hover:text-purple-300 transition-colors" />
          <div className="flex items-center justify-center mb-4">
  <h1 className="text-white text-2xl font-light tracking-[0.3em] uppercase">
    COSMIC QUIZ
  </h1>
</div>

        </div>

        {/* Progress */}
        <div className="text-white text-lg font-light mb-8 tracking-wider">
          {currentQuestionIndex + 1}/{totalQuestions}
        </div>

        {/* Quiz Card */}
        <div className="w-full max-w-md mx-auto">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl shadow-purple-500/20">
            {/* Question */}
            <h2 className="text-white text-xl font-light mb-8 text-center leading-relaxed">
              {currentQuestion.question}
            </h2>

            {/* Options */}
            <div className="space-y-4">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => onAnswerSelect && onAnswerSelect(option.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${
                    selectedAnswer === option.id
                      ? 'bg-white/20 border-2 border-purple-400 shadow-lg shadow-purple-400/30'
                      : 'bg-white/5 border border-white/10 hover:bg-white/15 hover:border-white/30'
                  }`}
                >
                  <span className="text-white font-light">
                    {option.id}) {option.text}
                    {selectedAnswer === option.id && (
                      <span className="ml-2 text-purple-300 text-sm">(selected)</span>
                    )}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full border-2 transition-colors duration-300 ${
                      selectedAnswer === option.id
                        ? 'border-purple-400 bg-purple-400/30'
                        : 'border-white/40 group-hover:border-white/60'
                    }`}
                  >
                    {selectedAnswer === option.id && (
                      <div className="w-2 h-2 bg-purple-400 rounded-full m-0.5"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center space-x-2 mt-8 mb-4">
          {progressDots}
        </div>

        {/* Timer */}
        {showTimer && (
          <div className="mb-8">
            <Clock className="text-white/60 w-5 h-5" />
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between w-full max-w-md">
          <button
            onClick={onPrevious}
            disabled={currentQuestionIndex === 0}
            className="flex items-center text-white/70 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </button>

          <button
            onClick={onNext}
            disabled={currentQuestionIndex === totalQuestions - 1}
            className="text-white/70 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>

          <button
            onClick={onSubmit}
            className="bg-white text-black px-6 py-2 rounded-full font-medium hover:bg-white/90 transition-colors shadow-lg"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

// Demo Component with Sample Data
export default function CosmicQuizDemo() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(1); 
  const [selectedAnswers, setSelectedAnswers] = useState({ 1: 'A' });

  const sampleQuestions = [
    {
      question: "What is the largest planet in our solar system?",
      options: [
        { id: 'A', text: 'Jupiter' },
        { id: 'B', text: 'Saturn' },
        { id: 'C', text: 'Neptune' },
        { id: 'D', text: 'Earth' }
      ]
    },
    {
      question: "What is the capital of France?",
      options: [
        { id: 'A', text: 'Paris' },
        { id: 'B', text: 'London' },
        { id: 'C', text: 'Berlin' },
        { id: 'D', text: 'Rome' }
      ]
    },
    {
      question: "Which galaxy contains our solar system?",
      options: [
        { id: 'A', text: 'Andromeda' },
        { id: 'B', text: 'Milky Way' },
        { id: 'C', text: 'Whirlpool' },
        { id: 'D', text: 'Triangulum' }
      ]
    },
    {
      question: "What is the speed of light in vacuum?",
      options: [
        { id: 'A', text: '299,792,458 m/s' },
        { id: 'B', text: '150,000,000 m/s' },
        { id: 'C', text: '500,000,000 m/s' },
        { id: 'D', text: '100,000,000 m/s' }
      ]
    },
    {
      question: "How many moons does Mars have?",
      options: [
        { id: 'A', text: '1' },
        { id: 'B', text: '2' },
        { id: 'C', text: '3' },
        { id: 'D', text: '0' }
      ]
    }
  ];

  const handleAnswerSelect = (answerId) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answerId
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < sampleQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    console.log('Quiz submitted!', selectedAnswers);
    alert('Quiz submitted! Check console for answers.');
  };

  return (
    <CosmicQuiz
      questions={sampleQuestions}
      currentQuestionIndex={currentQuestionIndex}
      selectedAnswer={selectedAnswers[currentQuestionIndex]}
      onAnswerSelect={handleAnswerSelect}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onSubmit={handleSubmit}
      totalQuestions={sampleQuestions.length}
    />
  );
}
