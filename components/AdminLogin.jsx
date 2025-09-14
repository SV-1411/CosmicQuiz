import React, { useState } from 'react'
import { adminLogin } from '../src/lib/auth'

export default function AdminLogin({ onLogin }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = adminLogin(credentials.username, credentials.password)
    
    if (result.success) {
      onLogin(result.user)
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-blue-950 w-full flex flex-col items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: "url('assets/cosmic-desktop.jpg')" }}
    >
      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6">
        <h1 className="text-4xl md:text-5xl font-serif text-white mb-16 tracking-wider">
          ADMIN PANEL
        </h1>

        <div className="w-full max-w-sm">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-2xl blur-xl opacity-20"></div>
            
            <div className="relative bg-slate-800 bg-opacity-60 backdrop-blur-lg border border-purple-300 border-opacity-30 rounded-2xl p-8 shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <input
                    type="text"
                    placeholder="Username"
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    className="w-full bg-transparent border-b border-gray-400 border-opacity-50 text-white placeholder-gray-400 py-3 px-0 focus:outline-none focus:border-purple-400 focus:border-opacity-80 transition-all duration-300"
                    required
                  />
                </div>

                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="w-full bg-transparent border-b border-gray-400 border-opacity-50 text-white placeholder-gray-400 py-3 px-0 focus:outline-none focus:border-purple-400 focus:border-opacity-80 transition-all duration-300"
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
                  {loading ? 'Logging in...' : 'Login as Admin'}
                </button>
              </form>

              <div className="mt-6 text-center text-gray-400 text-sm">
                <p>Default credentials:</p>
                <p>Username: admin | Password: admin123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
