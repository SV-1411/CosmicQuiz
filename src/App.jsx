import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { isAdminLoggedIn, isUserLoggedIn, getCurrentUser } from './lib/auth'

// Admin Components
import AdminLogin from '../components/AdminLogin'
import AdminDashboard from '../components/AdminDashboard'

// Participant Components
import ParticipantAuth from '../components/ParticipantAuth'
import QuizJoin from '../components/QuizJoin'
import ParticipantQuiz from '../components/ParticipantQuiz'

// Main App Component
function App() {
  return (
    <div className='min-h-screen w-full'>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminRoute />} />
        <Route path="/participant" element={<ParticipantRoute />} />
        <Route path="/quiz/:quizCode" element={<DirectQuizJoin />} />
      </Routes>
    </div>
  )
}

// Home Page - Choose Admin or Participant
function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-blue-950 w-full flex flex-col items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: "url('assets/cosmic-desktop.jpg')" }}
    >
      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6">
        <h1 className="text-4xl md:text-5xl font-serif text-white mb-16 tracking-wider text-center">
          COSMIC QUIZ
        </h1>

        <div className="w-full max-w-sm space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-2xl blur-xl opacity-20"></div>
            
            <div className="relative bg-slate-800 bg-opacity-60 backdrop-blur-lg border border-purple-300 border-opacity-30 rounded-2xl p-8 shadow-2xl">
              <div className="space-y-4">
                <button
                  onClick={() => navigate('/admin')}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium py-4 px-6 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105"
                >
                  Admin Panel
                </button>
                
                <button
                  onClick={() => navigate('/participant')}
                  className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white font-medium py-4 px-6 rounded-xl hover:from-green-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105"
                >
                  Join Quiz
                </button>
              </div>
              
              <div className="mt-6 text-center text-gray-400 text-sm">
                <p>Choose your role to continue</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Admin Route Handler
function AdminRoute() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setIsLoggedIn(isAdminLoggedIn())
    setLoading(false)
  }, [])

  const handleLogin = (user) => {
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-950 w-full bg-cover bg-center relative flex items-center justify-center"
        style={{ backgroundImage: "url('assets/cosmic-desktop.jpg')" }}
      >
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return <AdminLogin onLogin={handleLogin} />
  }

  return <AdminDashboard onLogout={handleLogout} />
}

// Participant Route Handler
function ParticipantRoute() {
  const [user, setUser] = useState(null)
  const [currentQuiz, setCurrentQuiz] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
    setLoading(false)
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    setUser(null)
    setCurrentQuiz(null)
  }

  const handleJoinQuiz = (quiz) => {
    setCurrentQuiz(quiz)
  }

  const handleLeaveQuiz = () => {
    setCurrentQuiz(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-950 w-full bg-cover bg-center relative flex items-center justify-center"
        style={{ backgroundImage: "url('assets/cosmic-desktop.jpg')" }}
      >
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <ParticipantAuth onLogin={handleLogin} />
  }

  if (!currentQuiz) {
    return <QuizJoin user={user} onJoinQuiz={handleJoinQuiz} />
  }

  return (
    <ParticipantQuiz 
      user={user} 
      quiz={currentQuiz} 
      onLogout={handleLogout}
      onLeaveQuiz={handleLeaveQuiz}
    />
  )
}

// Direct Quiz Join via URL
function DirectQuizJoin() {
  const { quizCode } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
      // Auto-redirect to participant route with quiz code pre-filled
      navigate('/participant', { state: { quizCode } })
    }
    setLoading(false)
  }, [quizCode, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-950 w-full bg-cover bg-center relative flex items-center justify-center"
        style={{ backgroundImage: "url('assets/cosmic-desktop.jpg')" }}
      >
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  // If not logged in, redirect to participant auth
  return <ParticipantAuth onLogin={() => navigate('/participant', { state: { quizCode } })} />
}

export default App
