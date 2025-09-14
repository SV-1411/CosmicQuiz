import React, { useState } from 'react'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import { addQuestion } from '../src/lib/quizService'

export default function CreateQuiz({ onBack, onCreate }) {
  const [quizData, setQuizData] = useState({
    title: '',
    description: ''
  })
  const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState({
    text: '',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ],
    timeLimit: 10,
    points: 10
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1) // 1: Quiz details, 2: Add questions

  const handleQuizSubmit = (e) => {
    e.preventDefault()
    if (!quizData.title.trim()) {
      setError('Quiz title is required')
      return
    }
    setStep(2)
    setError('')
  }

  const handleOptionChange = (index, value) => {
    const newOptions = [...currentQuestion.options]
    newOptions[index].text = value
    setCurrentQuestion({ ...currentQuestion, options: newOptions })
  }

  const handleCorrectAnswerChange = (index) => {
    const newOptions = currentQuestion.options.map((option, i) => ({
      ...option,
      isCorrect: i === index
    }))
    setCurrentQuestion({ ...currentQuestion, options: newOptions })
  }

  const addQuestionToList = () => {
    if (!currentQuestion.text.trim()) {
      setError('Question text is required')
      return
    }

    const filledOptions = currentQuestion.options.filter(opt => opt.text.trim())
    if (filledOptions.length < 2) {
      setError('At least 2 options are required')
      return
    }

    const hasCorrectAnswer = currentQuestion.options.some(opt => opt.isCorrect && opt.text.trim())
    if (!hasCorrectAnswer) {
      setError('Please select a correct answer')
      return
    }

    setQuestions([...questions, { ...currentQuestion, id: Date.now() }])
    setCurrentQuestion({
      text: '',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ],
      timeLimit: 10,
      points: 10
    })
    setError('')
  }

  const removeQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  const handleSaveQuiz = async () => {
    if (questions.length === 0) {
      setError('Add at least one question to save the quiz')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Create the quiz first
      const result = await onCreate(quizData.title, quizData.description)
      if (!result.success) {
        setError(result.error)
        setLoading(false)
        return
      }

      // Add all questions
      for (const question of questions) {
        const questionResult = await addQuestion(
          result.quiz.id,
          question.text,
          question.options.filter(opt => opt.text.trim()),
          question.timeLimit,
          question.points
        )
        
        if (!questionResult.success) {
          setError(`Failed to add question: ${questionResult.error}`)
          setLoading(false)
          return
        }
      }

      // Success - will be handled by parent component
    } catch (err) {
      setError(err.message)
    }
    
    setLoading(false)
  }

  if (step === 1) {
    return (
      <div className="min-h-screen bg-blue-950 w-full bg-cover bg-center relative"
        style={{ backgroundImage: "url('assets/cosmic-desktop.jpg')" }}
      >
        <div className="relative z-10 p-6">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={onBack}
              className="text-white hover:text-purple-300 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-4xl font-serif text-white tracking-wider">
              CREATE NEW QUIZ
            </h1>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-slate-800 bg-opacity-60 backdrop-blur-lg border border-purple-300 border-opacity-30 rounded-xl p-8">
              <form onSubmit={handleQuizSubmit} className="space-y-6">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Quiz Title *
                  </label>
                  <input
                    type="text"
                    value={quizData.title}
                    onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                    className="w-full bg-slate-700 bg-opacity-50 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-purple-400 transition-colors"
                    placeholder="Enter quiz title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    value={quizData.description}
                    onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
                    className="w-full bg-slate-700 bg-opacity-50 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-purple-400 transition-colors h-24 resize-none"
                    placeholder="Enter quiz description (optional)"
                  />
                </div>

                {error && (
                  <div className="text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105"
                >
                  Continue to Add Questions
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-950 w-full bg-cover bg-center relative"
      style={{ backgroundImage: "url('assets/cosmic-desktop.jpg')" }}
    >
      <div className="relative z-10 p-6">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setStep(1)}
            className="text-white hover:text-purple-300 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-4xl font-serif text-white tracking-wider">
              {quizData.title}
            </h1>
            <p className="text-gray-300 mt-1">Add Questions ({questions.length} added)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Question Form */}
          <div className="bg-slate-800 bg-opacity-60 backdrop-blur-lg border border-purple-300 border-opacity-30 rounded-xl p-6">
            <h2 className="text-2xl font-serif text-white mb-6">Add Question</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Question Text *
                </label>
                <textarea
                  value={currentQuestion.text}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                  className="w-full bg-slate-700 bg-opacity-50 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-purple-400 transition-colors h-24 resize-none"
                  placeholder="Enter your question"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Time Limit (seconds)
                  </label>
                  <input
                    type="number"
                    value={currentQuestion.timeLimit}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, timeLimit: parseInt(e.target.value) || 10 })}
                    className="w-full bg-slate-700 bg-opacity-50 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-purple-400 transition-colors"
                    min="5"
                    max="60"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Points
                  </label>
                  <input
                    type="number"
                    value={currentQuestion.points}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseInt(e.target.value) || 10 })}
                    className="w-full bg-slate-700 bg-opacity-50 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-purple-400 transition-colors"
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Options (select the correct answer)
                </label>
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={option.isCorrect}
                        onChange={() => handleCorrectAnswerChange(index)}
                        className="text-purple-500 focus:ring-purple-500"
                      />
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        className="flex-1 bg-slate-700 bg-opacity-50 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-purple-400 transition-colors"
                        placeholder={`Option ${index + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={addQuestionToList}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Add Question
              </button>
            </div>
          </div>

          {/* Questions List */}
          <div className="bg-slate-800 bg-opacity-60 backdrop-blur-lg border border-purple-300 border-opacity-30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif text-white">Questions ({questions.length})</h2>
              {questions.length > 0 && (
                <button
                  onClick={handleSaveQuiz}
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={16} />
                  {loading ? 'Saving...' : 'Save Quiz'}
                </button>
              )}
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {questions.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  No questions added yet
                </div>
              ) : (
                questions.map((question, index) => (
                  <div key={question.id} className="bg-slate-700 bg-opacity-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-white font-medium">Q{index + 1}. {question.text}</h3>
                      <button
                        onClick={() => removeQuestion(question.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="text-sm text-gray-300 mb-2">
                      Time: {question.timeLimit}s | Points: {question.points}
                    </div>
                    <div className="space-y-1">
                      {question.options.filter(opt => opt.text.trim()).map((option, optIndex) => (
                        <div key={optIndex} className={`text-sm px-2 py-1 rounded ${option.isCorrect ? 'bg-green-500 bg-opacity-20 text-green-300' : 'text-gray-400'}`}>
                          {option.text} {option.isCorrect && '✓'}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
