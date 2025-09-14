import React, { useState } from 'react'
import { User, Mail, Lock, UserPlus, LogIn } from 'lucide-react'
import { participantRegister, participantLogin } from '../src/lib/auth'

export default function ParticipantAuth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    fullName: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let result
      if (isLogin) {
        result = await participantLogin(formData.email, formData.password)
      } else {
        if (!formData.fullName.trim() || !formData.username.trim()) {
          setError('All fields are required for registration')
          setLoading(false)
          return
        }
        result = await participantRegister(formData.email, formData.username, formData.fullName, formData.password)
      }

      if (result.success) {
        onLogin(result.user)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }

    setLoading(false)
  }

  const resetForm = () => {
    setFormData({ email: '', username: '', fullName: '', password: '' })
    setError('')
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    resetForm()
  }

  return (
    <div className="min-h-screen bg-blue-950 w-full flex flex-col items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: "url('assets/cosmic-desktop.jpg')" }}
    >
      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6">
        <h1 className="text-4xl md:text-5xl font-serif text-white mb-16 tracking-wider">
          COSMIC QUIZ
        </h1>

        <div className="w-full max-w-sm">
          <h2 className="text-xl font-serif text-white mb-8 text-center">
            {isLogin ? 'Welcome Back' : 'Join the Quiz'}
          </h2>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-2xl blur-xl opacity-20"></div>
            
            <div className="relative bg-slate-800 bg-opacity-60 backdrop-blur-lg border border-purple-300 border-opacity-30 rounded-2xl p-8 shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-transparent border-b border-gray-400 border-opacity-50 text-white placeholder-gray-400 py-3 pl-10 pr-0 focus:outline-none focus:border-purple-400 focus:border-opacity-80 transition-all duration-300"
                    required
                  />
                </div>

                {!isLogin && (
                  <>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        placeholder="Username (display name)"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full bg-transparent border-b border-gray-400 border-opacity-50 text-white placeholder-gray-400 py-3 pl-10 pr-0 focus:outline-none focus:border-purple-400 focus:border-opacity-80 transition-all duration-300"
                        required
                      />
                    </div>

                    <div className="relative">
                      <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full bg-transparent border-b border-gray-400 border-opacity-50 text-white placeholder-gray-400 py-3 pl-10 pr-0 focus:outline-none focus:border-purple-400 focus:border-opacity-80 transition-all duration-300"
                        required
                      />
                    </div>
                  </>
                )}

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-transparent border-b border-gray-400 border-opacity-50 text-white placeholder-gray-400 py-3 pl-10 pr-0 focus:outline-none focus:border-purple-400 focus:border-opacity-80 transition-all duration-300"
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
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium py-3 px-6 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    'Processing...'
                  ) : (
                    <>
                      {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                      {isLogin ? 'Login' : 'Register'}
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={toggleMode}
                  className="text-purple-300 hover:text-purple-200 transition-colors text-sm"
                >
                  {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
