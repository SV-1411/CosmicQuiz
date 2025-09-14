import React, { useState } from 'react'
import { Hash, ArrowRight } from 'lucide-react'
import { getQuizByCode } from '../src/lib/quizService'

export default function QuizJoin({ user, onJoinQuiz }) {
  const [quizCode, setQuizCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [quiz, setQuiz] = useState(null)

  const handleCodeSubmit = async (e) => {
    e.preventDefault()
    if (!quizCode.trim()) {
      setError('Please enter a quiz code')
      return
    }

    setLoading(true)
    setError('')

    const result = await getQuizByCode(quizCode.toUpperCase())
    if (result.success) {
      setQuiz(result.quiz)
    } else {
      setError('Quiz not found. Please check the code and try again.')
    }
    setLoading(false)
  }

  const handleJoinQuiz = () => {
    onJoinQuiz(quiz)
  }

  return (
    <div className="min-h-screen bg-blue-950 w-full flex flex-col items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: "url('assets/cosmic-desktop.jpg')" }}
    >
      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6">
        <h1 className="text-4xl md:text-5xl font-serif text-white mb-8 tracking-wider">
          COSMIC QUIZ
        </h1>

        <div className="text-center mb-8">
          <p className="text-purple-300 text-lg">Welcome, {user.username}!</p>
          <p className="text-gray-300 text-sm mt-1">Enter a quiz code to join</p>
        </div>

        <div className="w-full max-w-sm">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-2xl blur-xl opacity-20"></div>
            
            <div className="relative bg-slate-800 bg-opacity-60 backdrop-blur-lg border border-purple-300 border-opacity-30 rounded-2xl p-8 shadow-2xl">
              {!quiz ? (
                <form onSubmit={handleCodeSubmit} className="space-y-6">
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Enter Quiz Code"
                      value={quizCode}
                      onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
                      className="w-full bg-transparent border-b border-gray-400 border-opacity-50 text-white placeholder-gray-400 py-3 pl-10 pr-0 focus:outline-none focus:border-purple-400 focus:border-opacity-80 transition-all duration-300 font-mono text-center text-lg tracking-widest"
                      maxLength="6"
                      required
                    />
                  </div>

                  {error && (
                    <div className="text-red-400 text-sm text-center">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium py-3 px-6 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Finding Quiz...' : 'Find Quiz'}
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Hash className="text-white" size={24} />
                    </div>
                    <h2 className="text-2xl font-serif text-white mb-2">{quiz.title}</h2>
                    {quiz.description && (
                      <p className="text-gray-300 text-sm mb-4">{quiz.description}</p>
                    )}
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <span className="text-purple-300">Code: {quiz.quiz_code}</span>
                      <span className={`px-2 py-1 rounded-full text-xs text-white ${
                        quiz.status === 'active' ? 'bg-green-500' : 
                        quiz.status === 'waiting' ? 'bg-yellow-500' :
                        quiz.status === 'completed' ? 'bg-blue-500' : 'bg-gray-500'
                      }`}>
                        {quiz.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {quiz.status === 'completed' ? (
                    <div className="text-center">
                      <p className="text-yellow-400 mb-4">This quiz has already ended</p>
                      <button
                        onClick={() => {
                          setQuiz(null)
                          setQuizCode('')
                        }}
                        className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-xl transition-colors"
                      >
                        Try Another Code
                      </button>
                    </div>
                  ) : quiz.status === 'draft' ? (
                    <div className="text-center">
                      <p className="text-yellow-400 mb-4">This quiz hasn't started yet</p>
                      <button
                        onClick={() => {
                          setQuiz(null)
                          setQuizCode('')
                        }}
                        className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-xl transition-colors"
                      >
                        Try Another Code
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <button
                        onClick={handleJoinQuiz}
                        className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-medium py-3 px-6 rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                      >
                        Join Quiz
                        <ArrowRight size={20} />
                      </button>
                      
                      <button
                        onClick={() => {
                          setQuiz(null)
                          setQuizCode('')
                        }}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors text-sm"
                      >
                        Try Different Code
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
