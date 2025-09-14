import React, { useState, useEffect } from 'react'
import { ArrowLeft, Play, Square, Clock, BarChart3, RefreshCw } from 'lucide-react'
import { getQuizById, getActiveSession, startNextQuestion, endCurrentQuestion, getLeaderboard, restartQuiz, stopQuiz, deleteQuiz } from '../src/lib/quizService'
import { supabase } from '../src/lib/supabase'

export default function QuizManagement({ quiz, onBack, onUpdate }) {
  const [quizDetails, setQuizDetails] = useState(null)
  const [activeSession, setActiveSession] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    loadQuizDetails()

    // Realtime: session updates by quiz
    const sessionSubscription = supabase
      .channel(`quiz_sessions_${quiz.id}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'quiz_sessions', filter: `quiz_id=eq.${quiz.id}` },
        () => {
          loadActiveSession()
        }
      )
      .subscribe()

    // Participants & leaderboard subscriptions will be created when we know activeSession.id
    let participantsSub = null
    let leaderboardSub = null

    const attachSessionBoundSubs = (sessionId) => {
      if (!sessionId) return
      if (!participantsSub) {
        participantsSub = supabase
          .channel(`participants_${sessionId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `quiz_session_id=eq.${sessionId}` }, () => {
            loadParticipants()
          })
          .subscribe()
      }
      if (!leaderboardSub) {
        leaderboardSub = supabase
          .channel(`leaderboard_${sessionId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard', filter: `quiz_session_id=eq.${sessionId}` }, () => {
            loadLeaderboard()
          })
          .subscribe()
      }
    }

    // Attach when session becomes known
    if (activeSession?.id) attachSessionBoundSubs(activeSession.id)

    return () => {
      sessionSubscription.unsubscribe()
      if (participantsSub) participantsSub.unsubscribe()
      if (leaderboardSub) leaderboardSub.unsubscribe()
    }
  }, [quiz.id, activeSession?.id])

  useEffect(() => {
    if (activeSession && activeSession.session_status === 'question_active' && activeSession.question_end_time) {
      const endTime = new Date(activeSession.question_end_time).getTime()
      
      const timer = setInterval(() => {
        const now = Date.now()
        const remaining = Math.max(0, Math.ceil((endTime - now) / 1000))
        setTimeLeft(remaining)
        
        if (remaining === 0) {
          handleEndQuestion()
          clearInterval(timer)
        }
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [activeSession])

  // Fallback polling to ensure realtime consistency
  useEffect(() => {
    let poller
    if (activeSession) {
      poller = setInterval(() => {
        loadParticipants()
        loadLeaderboard()
        loadActiveSession()
      }, 2000)
    }
    return () => {
      if (poller) clearInterval(poller)
    }
  }, [activeSession])

  const loadQuizDetails = async () => {
    const result = await getQuizById(quiz.id)
    if (result.success) {
      setQuizDetails(result.quiz)
      await loadActiveSession()
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  const loadActiveSession = async () => {
    const result = await getActiveSession(quiz.id)
    if (result.success && result.session) {
      setActiveSession(result.session)
      await loadParticipants()
      await loadLeaderboard()
      
      if (result.session.current_question_id) {
        await loadCurrentQuestion(result.session.current_question_id)
      }
    }
  }

  const loadCurrentQuestion = async (questionId) => {
    const { data, error } = await supabase
      .from('questions')
      .select('*, question_options (*)')
      .eq('id', questionId)
      .maybeSingle()
    if (!error) setCurrentQuestion(data)
  }

  const loadParticipants = async () => {
    if (!activeSession) return
    
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('quiz_session_id', activeSession.id)
      .order('joined_at')

    if (!error) {
      setParticipants(data || [])
    }
  }

  const loadLeaderboard = async () => {
    if (!activeSession) return
    
    const result = await getLeaderboard(activeSession.id)
    if (result.success) {
      setLeaderboard(result.leaderboard)
    }
  }

  const handleStartNextQuestion = async () => {
    if (!activeSession) return
    
    const result = await startNextQuestion(activeSession.id)
    if (result.success) {
      if (result.completed) {
        await onUpdate()
        setActiveSession(null)
      } else {
        setActiveSession(result.session)
        setCurrentQuestion(result.question)
      }
    } else {
      setError(result.error)
    }
  }

  const handleStopQuiz = async () => {
    if (!activeSession) return
    if (!window.confirm('Are you sure you want to stop the quiz?')) return
    const res = await stopQuiz(activeSession.id, quiz.id)
    if (res.success) {
      await loadActiveSession()
      await loadLeaderboard()
    } else {
      setError(res.error)
    }
  }

  const handleRestartQuiz = async () => {
    if (!window.confirm('Restart will reset all progress. Continue?')) return
    const res = await restartQuiz(quiz.id)
    if (res.success) {
      setActiveSession(null)
      await onUpdate()
    } else {
      setError(res.error)
    }
  }

  const handleDeleteQuiz = async () => {
    if (!window.confirm('Delete this quiz permanently?')) return
    const res = await deleteQuiz(quiz.id)
    if (res.success) {
      onBack()
      await onUpdate()
    } else {
      setError(res.error)
    }
  }

  const handleEndQuestion = async () => {
    if (!activeSession) return
    
    const result = await endCurrentQuestion(activeSession.id)
    if (result.success) {
      setActiveSession(result.session)
      await loadLeaderboard()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-950 w-full bg-cover bg-center relative flex items-center justify-center"
        style={{ backgroundImage: "url('assets/cosmic-desktop.jpg')" }}
      >
        <div className="text-white text-xl">Loading quiz details...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-950 w-full bg-cover bg-center relative"
      style={{ backgroundImage: "url('assets/cosmic-desktop.jpg')" }}
    >
      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between gap-4 mb-8">
          <button
            onClick={onBack}
            className="text-white hover:text-purple-300 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="text-4xl font-serif text-white tracking-wider">
              {quiz.title}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-purple-300">Code: {quiz.quiz_code}</span>
              <span className={`px-3 py-1 rounded-full text-sm ${
                quiz.status === 'active' ? 'bg-green-500' : 
                quiz.status === 'waiting' ? 'bg-yellow-500' :
                quiz.status === 'completed' ? 'bg-blue-500' : 'bg-gray-500'
              } text-white`}>
                {quiz.status.toUpperCase()}
              </span>
            </div>
          </div>
          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleRestartQuiz}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg text-sm"
            >
              Restart
            </button>
            <button
              onClick={handleStopQuiz}
              disabled={!activeSession}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              Stop
            </button>
            <button
              onClick={handleDeleteQuiz}
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm"
            >
              Delete
            </button>
          </div>

        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quiz Control Panel */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800 bg-opacity-60 backdrop-blur-lg border border-purple-300 border-opacity-30 rounded-xl p-6 mb-6">
              <h2 className="text-2xl font-serif text-white mb-4">Quiz Control</h2>
              
              {!activeSession ? (
                <div className="text-center py-8">
                  <p className="text-gray-300 mb-4">No active session for this quiz</p>
                  <p className="text-sm text-gray-400">Quiz needs to be started from the dashboard</p>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {activeSession.current_question_number || 0}
                      </div>
                      <div className="text-sm text-gray-300">Current Question</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {activeSession.total_questions}
                      </div>
                      <div className="text-sm text-gray-300">Total Questions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {participants.length}
                      </div>
                      <div className="text-sm text-gray-300">Participants</div>
                    </div>
                  </div>

                  {activeSession.session_status === 'question_active' && currentQuestion && (
                    <div className="bg-slate-700 bg-opacity-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white font-medium">Current Question</h3>
                        <div className="flex items-center gap-2 text-yellow-400">
                          <Clock size={16} />
                          <span className="font-mono text-lg">{timeLeft}s</span>
                        </div>
                      </div>
                      <p className="text-gray-300 mb-3">{currentQuestion.question_text}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {currentQuestion.question_options?.map((option, index) => (
                          <div key={option.id} className={`p-2 rounded text-sm ${
                            option.is_correct ? 'bg-green-500 bg-opacity-20 text-green-300' : 'bg-slate-600 text-gray-300'
                          }`}>
                            {option.option_text} {option.is_correct && '✓'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    {activeSession.session_status === 'waiting' && (
                      <button
                        onClick={handleStartNextQuestion}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Play size={20} />
                        Start First Question
                      </button>
                    )}

                    {activeSession.session_status === 'showing_leaderboard' && (
                      <button
                        onClick={handleStartNextQuestion}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Play size={20} />
                        Next Question
                      </button>
                    )}

                    {activeSession.session_status === 'question_active' && (
                      <button
                        onClick={handleEndQuestion}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Square size={20} />
                        End Question
                      </button>
                    )}

                    <button
                      onClick={() => {
                        loadActiveSession()
                        loadParticipants()
                        loadLeaderboard()
                      }}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-lg transition-colors"
                    >
                      <RefreshCw size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Participants List */}
            <div className="bg-slate-800 bg-opacity-60 backdrop-blur-lg border border-purple-300 border-opacity-30 rounded-xl p-6">
              <h2 className="text-2xl font-serif text-white mb-4">Participants ({participants.length})</h2>
              
              {participants.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  No participants joined yet
                  <div className="text-sm mt-2">
                    Share quiz code: <span className="font-mono bg-slate-700 px-2 py-1 rounded">{quiz.quiz_code}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between bg-slate-700 bg-opacity-50 rounded-lg p-3">
                      <div>
                        <div className="text-white font-medium">{participant.username}</div>
                        <div className="text-sm text-gray-400">
                          Joined: {new Date(participant.joined_at).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold">{participant.total_score} pts</div>
                        <div className="text-xs text-gray-400">
                          Last active: {new Date(participant.last_active).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-slate-800 bg-opacity-60 backdrop-blur-lg border border-purple-300 border-opacity-30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={24} className="text-purple-400" />
              <h2 className="text-2xl font-serif text-white">Live Leaderboard</h2>
            </div>
            
            {leaderboard.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No scores yet
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                  <div key={entry.id} className={`flex items-center gap-3 p-3 rounded-lg ${
                    index === 0 ? 'bg-yellow-500 bg-opacity-20 border border-yellow-500 border-opacity-30' :
                    index === 1 ? 'bg-gray-400 bg-opacity-20 border border-gray-400 border-opacity-30' :
                    index === 2 ? 'bg-orange-600 bg-opacity-20 border border-orange-600 border-opacity-30' :
                    'bg-slate-700 bg-opacity-50'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      'bg-slate-600 text-gray-300'
                    }`}>
                      {entry.current_position}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">{entry.username}</div>
                      <div className="text-xs text-gray-400">
                        {entry.questions_answered} questions answered
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">{entry.total_score}</div>
                      <div className="text-xs text-gray-400">points</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quiz Questions Summary */}
        {quizDetails && (
          <div className="mt-8 bg-slate-800 bg-opacity-60 backdrop-blur-lg border border-purple-300 border-opacity-30 rounded-xl p-6">
            <h2 className="text-2xl font-serif text-white mb-4">Quiz Questions ({quizDetails.questions?.length || 0})</h2>
            
            {!quizDetails.questions || quizDetails.questions.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No questions added to this quiz yet
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quizDetails.questions
                  .sort((a, b) => a.question_order - b.question_order)
                  .map((question, index) => (
                    <div key={question.id} className="bg-slate-700 bg-opacity-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-white font-medium">Q{question.question_order}. {question.question_text}</h3>
                        <div className="text-xs text-gray-400">
                          {question.time_limit}s | {question.points}pts
                        </div>
                      </div>
                      <div className="space-y-1">
                        {question.question_options
                          ?.sort((a, b) => a.option_order - b.option_order)
                          .map((option) => (
                            <div key={option.id} className={`text-sm px-2 py-1 rounded ${
                              option.is_correct ? 'bg-green-500 bg-opacity-20 text-green-300' : 'text-gray-400'
                            }`}>
                              {option.option_text} {option.is_correct && '✓'}
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </div>
  )
}
