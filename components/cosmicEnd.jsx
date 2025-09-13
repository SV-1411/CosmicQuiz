import React from 'react';

export default function CongratulationsScreen({ 
  score = 8, 
  totalQuestions = 10, 
  onReviewAnswers, 
  onReturnHome 
}) {
  // Generate animated stars
  const generateStars = (count) => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 3,
      duration: Math.random() * 2 + 2
    }));
  };

  const stars = generateStars(60);

  const getPerformanceMessage = (score, total) => {
    const percentage = (score / total) * 100;
    if (percentage >= 90) return "Stellar performance!";
    if (percentage >= 80) return "Excellent work!";
    if (percentage >= 70) return "Great job!";
    if (percentage >= 60) return "Good effort!";
    return "Keep trying!";
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background Stars */}
      <div className="absolute inset-0">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`
            }}
          />
        ))}
      </div>

      {/* Glowing Border */}
      <div className="absolute inset-4 md:inset-8 border border-white/20 rounded-3xl bg-white/5 backdrop-blur-sm shadow-2xl shadow-purple-500/20"></div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6 md:p-8">
        {/* Title */}
        <div className="text-center mb-8 md:mb-12">
          <h1 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-white tracking-wider mb-4 animate-fade-in"
            style={{ 
              fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
              animationDelay: '0.2s'
            }}
          >
            CONGRATULATIONS!
          </h1>
        </div>

        {/* Score Section */}
        <div className="text-center mb-8 md:mb-12 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <p className="text-xl sm:text-2xl md:text-3xl text-white font-light mb-2 md:mb-4">
            Your Score: <span className="font-normal">{score}/{totalQuestions}</span>
          </p>
          <p className="text-lg sm:text-xl md:text-2xl text-white/90 font-light">
            {getPerformanceMessage(score, totalQuestions)}
          </p>
        </div>

        {/* Buttons */}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
          opacity: 0;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}