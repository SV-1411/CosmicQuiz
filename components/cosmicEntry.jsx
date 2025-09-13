import React, { useState } from 'react';

export default function CosmicQuizEntry() {
  const [teamNumber, setTeamNumber] = useState('');
  const [memberName, setMemberName] = useState('');

  const handleBegin = () => {
    if (teamNumber && memberName) {
      alert(`Welcome ${memberName} from Team ${teamNumber}! Let's begin the cosmic quiz!`);
    } else {
      alert('Please fill in both fields to continue.');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: "url('assets/cosmic-desktop.jpg')" }}
    >
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6">
        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-serif text-white mb-16 tracking-wider me-1">
          COSMIC QUIZ
        </h1>

        {/* Form Container */}
        <div className="w-full max-w-sm">
          <h2 className="text-xl font-serif text-white mb-8 text-center">
            Enter Details
          </h2>

          {/* Glassmorphism Card */}
          <div className="relative">
            {/* Glow effect behind card */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-2xl blur-xl opacity-20"></div>
            
            <div className="relative bg-slate-800 bg-opacity-60 backdrop-blur-lg border border-purple-300 border-opacity-30 rounded-2xl p-8 shadow-2xl">
              <div className="space-y-6">
                {/* Team Number Input */}
                <div>
                  <input
                    type="text"
                    placeholder="Team Number"
                    value={teamNumber}
                    onChange={(e) => setTeamNumber(e.target.value)}
                    className="w-full bg-transparent border-b border-gray-400 border-opacity-50 text-white placeholder-gray-400 py-3 px-0 focus:outline-none focus:border-purple-400 focus:border-opacity-80 transition-all duration-300 font-sans"
                  />
                </div>

                {/* Member Name Input */}
                <div>
                  <input
                    type="text"
                    placeholder="Member Name"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    className="w-full bg-transparent border border-gray-400 border-opacity-50 rounded-full text-white placeholder-gray-400 py-3 px-6 focus:outline-none focus:border-purple-400 focus:border-opacity-80 transition-all duration-300 font-sans"
                  />
                </div>

                {/* Description */}
                <p className="text-gray-400 text-sm text-center mt-6 font-sans">
                  the Quiz will immediately start after you begin so BE READY
                </p>

                {/* Begin Button */}
                <button
                  onClick={handleBegin}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 font-sans mt-8"
                >
                  Begin
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Inter:wght@300;400;500;600&display=swap');
        
        .font-serif {
          font-family: 'Cormorant Garamond', serif;
        }
        
        .font-sans {
          font-family: 'Inter', sans-serif;
        }
        
        /* Custom twinkling animation for more variation */
        @keyframes twinkle {
          0%, 100% { 
            opacity: 0.2; 
            transform: scale(1);
          }
          50% { 
            opacity: 1; 
            transform: scale(1.2);
          }
        }
        
        /* Apply custom animation to stars */
        .star-twinkle {
          animation: twinkle 3s infinite;
        }
        
        /* Floating glow animation */
        @keyframes float-glow {
          0%, 100% { 
            opacity: 0.05;
            transform: scale(1);
          }
          50% { 
            opacity: 0.15;
            transform: scale(1.1);
          }
        }
        
        .glow-float {
          animation: float-glow 4s infinite ease-in-out;
        }
        
        /* Button hover effects */
        .button-hover {
          position: relative;
          overflow: hidden;
        }
        
        .button-hover:hover {
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          box-shadow: 0 10px 25px rgba(139, 92, 246, 0.4);
          transform: translateY(-2px) scale(1.02);
        }
        
        .button-hover:active {
          transform: translateY(0) scale(0.98);
        }
        
        /* Input glow effects */
        .input-glow:focus {
          box-shadow: 0 0 15px rgba(168, 85, 247, 0.3);
          border-color: #a855f7 !important;
          border-opacity: 1 !important;
        }
        
        .input-glow:hover {
          border-color: #c084fc;
          border-opacity: 0.7;
        }
      `}</style>
    </div>
  );
}