import React, { useState, useEffect } from 'react'
import { ArrowLeft, Play, Square, Clock, BarChart3, RefreshCw } from 'lucide-react'
import { getQuizById, getActiveSession, startNextQuestion, endCurrentQuestion, getLeaderboard, restartQuiz, stopQuiz, deleteQuiz } from '../src/lib/quizService'
import { supabase } from '../src/lib/supabase'
import { getPaginatedParticipants, getPaginatedLeaderboard, SubscriptionManager, debounce } from '../src/lib/performance'

export default function QuizManagement({ quiz, onBack, onUpdate }) {
  const [quizDetails, setQuizDetails] = useState(null)
  const [activeSession, setActiveSession] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [participants, setParticipants] = useState([])
  const [participantsPage, setParticipantsPage] = useState(0)
  const [participantsHasMore, setParticipantsHasMore] = useState(false)
  const [leaderboardPage, setLeaderboardPage] = useState(0)
  const [leaderboardHasMore, setLeaderboardHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [subscriptionManager] = useState(() => new SubscriptionManager())

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
    <div className="min-h-screen bg-blue-950 w-full bg-cover bg-center relative flex"
      style={{ backgroundImage: "url('assets/cosmic-desktop.jpg')" }}
    >
      {/* Left Sidebar */}
      <div className="w-80 bg-slate-900/80 backdrop-blur-lg border-r border-purple-300/30 p-6 flex flex-col">
        <button
          onClick={onBack}
          className="text-white hover:text-purple-300 transition-colors mb-6 self-start"
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-white tracking-wider mb-4">
            {quiz.title}
          </h1>
          <div className="space-y-2">
            <div className="text-purple-300 text-sm">Code: {quiz.quiz_code}</div>
            <div className={`px-3 py-1 rounded-full text-sm inline-block ${
              quiz.status === 'active' ? 'bg-green-500' : 
              quiz.status === 'waiting' ? 'bg-yellow-500' :
              quiz.status === 'completed' ? 'bg-blue-500' : 'bg-gray-500'
            } text-white`}>
              {quiz.status.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Action buttons in sidebar */}
        <div className="space-y-3 mb-8">
          <button
            onClick={handleRestartQuiz}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Restart Quiz
          </button>
          <button
            onClick={handleStopQuiz}
            disabled={!activeSession}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Square size={18} />
            Stop Quiz
          </button>
          <button
            onClick={handleDeleteQuiz}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Delete Quiz
          </button>
        </div>

        {/* Session info in sidebar */}
        {activeSession && (
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h3 className="text-white font-medium mb-3">Session Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Status:</span>
                <span className="text-purple-300 font-medium">{activeSession.session_status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Question:</span>
                <span className="text-white">{activeSession.current_question_number || 0}/{activeSession.total_questions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Participants:</span>
                <span className="text-white">{participants.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 space-y-6">

        {error && (
          <div className="bg-red-500/15 border border-red-500/50 text-red-300 p-4 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quiz Control Panel */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/70 backdrop-blur-lg border border-purple-300/30 rounded-xl p-6 shadow-xl">
              <h2 className="text-2xl font-serif text-white mb-6">Quiz Control</h2>
              
              {!activeSession ? (
                <div className="text-center py-8">
                  <p className="text-gray-300 mb-4">No active session for this quiz</p>
                  <p className="text-sm text-gray-400">Quiz needs to be started from the dashboard</p>
                </div>
              ) : (
                <div>
                  {activeSession.session_status === 'question_active' && currentQuestion && (
                    <div className="bg-slate-700/50 rounded-lg p-6 mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white font-medium">Current Question</h3>
                        <div className="flex items-center gap-2 text-yellow-400">
                          <Clock size={16} />
                          <span className="font-mono text-lg">{timeLeft}s</span>
                        </div>
                      </div>
                      <p className="text-gray-300 mb-3">{currentQuestion.question_text}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {currentQuestion.question_options?.map((option, index) => (
                          <div key={option.id} className={`p-3 rounded text-sm ${
                            option.is_correct ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-slate-600 text-gray-300'
                          }`}>
                            {option.option_text} {option.is_correct && '✓'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4">
                    {activeSession.session_status === 'waiting' && (
                      <button
                        onClick={handleStartNextQuestion}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 shadow-lg"
                      >
                        <Play size={20} />
                        Start First Question
                      </button>
                    )}

                    {activeSession.session_status === 'showing_leaderboard' && (
                      <button
                        onClick={handleStartNextQuestion}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 shadow-lg"
                      >
                        <Play size={20} />
                        Next Question
                      </button>
                    )}

                    {activeSession.session_status === 'question_active' && (
                      <button
                        onClick={handleEndQuestion}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 shadow-lg"
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
                      className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-lg transition-colors shadow-lg"
                    >
                      <RefreshCw size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Participants List */}
            <div className="mt-6 bg-slate-800/70 backdrop-blur-lg border border-purple-300/30 rounded-xl p-6 shadow-xl">
              <h2 className="text-2xl font-serif text-white mb-4">Participants ({participants.length})</h2>
              
              {participants.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  No participants joined yet
                  <div className="text-sm mt-2">
                    Share quiz code: <span className="font-mono bg-slate-700 px-2 py-1 rounded">{quiz.quiz_code}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between bg-slate-700/50 rounded-lg p-4">
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
          <div className="lg:col-span-1 bg-slate-800/70 backdrop-blur-lg border border-purple-300/30 rounded-xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={24} className="text-purple-400" />
              <h2 className="text-xl font-serif text-white">Leaderboard</h2>
            </div>
            
            {leaderboard.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No scores yet
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {leaderboard.map((entry, index) => (
                  <div key={entry.id} className={`flex items-center gap-2 p-3 rounded-lg ${
                    index === 0 ? 'bg-yellow-500 bg-opacity-20 border border-yellow-500 border-opacity-30' :
                    index === 1 ? 'bg-gray-400 bg-opacity-20 border border-gray-400 border-opacity-30' :
                    index === 2 ? 'bg-orange-600 bg-opacity-20 border border-orange-600 border-opacity-30' :
                    'bg-slate-700 bg-opacity-50'
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      'bg-slate-600 text-gray-300'
                    }`}>
                      {entry.current_position}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium text-sm">{entry.username}</div>
                      <div className="text-xs text-gray-500">
                        {entry.questions_answered} questions answered
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold text-sm">{entry.total_score}</div>
                      <div className="text-xs text-gray-500">pts</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quiz Questions Summary - Full Width Bottom Section */}
        {quizDetails && (
          <div className="bg-slate-800/70 backdrop-blur-lg border border-purple-300/30 rounded-xl p-6 shadow-xl">
            <h2 className="text-2xl font-serif text-white mb-6">Quiz Questions ({quizDetails.questions?.length || 0})</h2>
            {!quizDetails.questions || quizDetails.questions.length === 0 ? (
              <div className="text-center text-gray-400 py-12">No questions added to this quiz yet</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quizDetails.questions
                  .sort((a, b) => a.question_order - b.question_order)
                  .map((question) => (
                    <div key={question.id} className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-white font-medium">Q{question.question_order}. {question.question_text}</h3>
                        <div className="text-xs text-gray-400">{question.time_limit}s | {question.points}pts</div>
                      </div>
                      <div className="space-y-2">
                        {question.question_options?.sort((a, b) => a.option_order - b.option_order).map((option) => (
                          <div key={option.id} className={`text-xs px-3 py-2 rounded ${option.is_correct ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-slate-600/50 text-gray-400'}`}>
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
  )
}
