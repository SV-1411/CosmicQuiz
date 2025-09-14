import React, { useState, useEffect } from 'react'
import { Plus, Play, Square, Users, Clock, Trophy, LogOut } from 'lucide-react'
import { getQuizzes, createQuiz, startQuizSession, getActiveSession } from '../src/lib/quizService'
import { adminLogout } from '../src/lib/auth'
import CreateQuiz from './CreateQuiz'
import QuizManagement from './QuizManagement'

export default function AdminDashboard({ onLogout }) {
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('dashboard') // dashboard, create, manage
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadQuizzes()
  }, [])

  const loadQuizzes = async () => {
    setLoading(true)
    const result = await getQuizzes()
    if (result.success) {
      setQuizzes(result.quizzes)
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  const handleCreateQuiz = async (title, description) => {
    const result = await createQuiz(title, description)
    if (result.success) {
      await loadQuizzes()
      setActiveView('manage')
      setSelectedQuiz(result.quiz)
      // Return the created quiz so the caller (CreateQuiz) can use quiz.id
      return { success: true, quiz: result.quiz }
    }
    return result
  }

  const handleStartQuiz = async (quizId) => {
    const result = await startQuizSession(quizId)
    if (result.success) {
      await loadQuizzes()
      setActiveView('manage')
      setSelectedQuiz(quizzes.find(q => q.id === quizId))
    } else {
      setError(result.error)
    }
  }

  const handleLogout = () => {
    adminLogout()
    onLogout()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-500'
      case 'waiting': return 'bg-yellow-500'
      case 'active': return 'bg-green-500'
      case 'completed': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  if (activeView === 'create') {
    return (
      <CreateQuiz 
        onBack={() => setActiveView('dashboard')}
        onCreate={handleCreateQuiz}
      />
    )
  }

  if (activeView === 'manage' && selectedQuiz) {
    return (
      <QuizManagement 
        quiz={selectedQuiz}
        onBack={() => setActiveView('dashboard')}
        onUpdate={loadQuizzes}
      />
    )
  }

  return (
    <div className="min-h-screen bg-blue-950 w-full bg-cover bg-center relative"
      style={{ backgroundImage: "url('assets/cosmic-desktop.jpg')" }}
    >
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-serif text-white tracking-wider">
            ADMIN DASHBOARD
          </h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 bg-opacity-60 backdrop-blur-lg border border-purple-300 border-opacity-30 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Trophy size={24} className="text-white" />
              </div>
              <div>
                <p className="text-gray-300 text-sm">Total Quizzes</p>
                <p className="text-white text-2xl font-bold">{quizzes.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 bg-opacity-60 backdrop-blur-lg border border-purple-300 border-opacity-30 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <Play size={24} className="text-white" />
              </div>
              <div>
                <p className="text-gray-300 text-sm">Active Quizzes</p>
                <p className="text-white text-2xl font-bold">
                  {quizzes.filter(q => q.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 bg-opacity-60 backdrop-blur-lg border border-purple-300 border-opacity-30 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500 rounded-lg">
                <Clock size={24} className="text-white" />
              </div>
              <div>
                <p className="text-gray-300 text-sm">Draft Quizzes</p>
                <p className="text-white text-2xl font-bold">
                  {quizzes.filter(q => q.status === 'draft').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 bg-opacity-60 backdrop-blur-lg border border-purple-300 border-opacity-30 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Square size={24} className="text-white" />
              </div>
              <div>
                <p className="text-gray-300 text-sm">Completed</p>
                <p className="text-white text-2xl font-bold">
                  {quizzes.filter(q => q.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveView('create')}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105"
          >
            <Plus size={20} />
            Create New Quiz
          </button>
        </div>

        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Quizzes List */}
        <div className="bg-slate-800 bg-opacity-60 backdrop-blur-lg border border-purple-300 border-opacity-30 rounded-xl p-6">
          <h2 className="text-2xl font-serif text-white mb-6">All Quizzes</h2>
          
          {loading ? (
            <div className="text-center text-gray-300 py-8">Loading quizzes...</div>
          ) : quizzes.length === 0 ? (
            <div className="text-center text-gray-300 py-8">
              No quizzes created yet. Create your first quiz!
            </div>
          ) : (
            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="bg-slate-700 bg-opacity-50 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-medium text-lg">{quiz.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(quiz.status)}`}>
                        {quiz.status.toUpperCase()}
                      </span>
                      <span className="text-gray-400 text-sm">Code: {quiz.quiz_code}</span>
                    </div>
                    <p className="text-gray-300 text-sm">{quiz.description}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      Created: {new Date(quiz.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedQuiz(quiz)
                        setActiveView('manage')
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Manage
                    </button>
                    
                    {quiz.status === 'draft' && (
                      <button
                        onClick={() => handleStartQuiz(quiz.id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Play size={16} />
                        Start
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
