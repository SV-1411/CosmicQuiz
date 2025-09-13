import React from 'react';
import { ChevronRight, Clock } from 'lucide-react';

const CosmicQuiz = ({ 
  questions = [],
  currentQuestionIndex = 0,
  onAnswerSelect,
  onNext,
  onSubmit,
  selectedAnswer = null,
  showTimer = true,
  totalQuestions = 10
}) => {
  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) return null;

  // Progress dots
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
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen w-full p-4">

        {/* Progress */}
        <div className="text-white text-lg font-light mb-6 tracking-wider">
          {currentQuestionIndex + 1}/{totalQuestions}
        </div>

        {/* Quiz Card */}
        <div className="w-full max-w-md mx-auto">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl shadow-purple-500/20">
            <h2 className="text-white text-xl font-light mb-8 text-center leading-relaxed">
              {currentQuestion.question}
            </h2>

            {/* Options */}
            <div className="space-y-4">
              {currentQuestion.options.map(option => (
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
                  <div className={`w-5 h-5 rounded-full border-2 transition-colors duration-300 ${
                    selectedAnswer === option.id
                      ? 'border-purple-400 bg-purple-400/30'
                      : 'border-white/40 group-hover:border-white/60'
                  }`}>
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
        <div className="flex items-center justify-end w-full max-w-md">
          {currentQuestionIndex === totalQuestions - 1 ? (
            <button
              onClick={onSubmit}
              className="flex items-center text-purple-300 hover:text-purple-400 transition-colors"
            >
              Submit
            </button>
          ) : (
            <button
              onClick={onNext}
              className="flex items-center text-white/70 hover:text-white transition-colors"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CosmicQuiz;
