import React, { useState, useEffect } from 'react'
import { Clock, Users, Trophy, LogOut } from 'lucide-react'
import { joinQuiz, submitAnswer, getLeaderboard } from '../src/lib/quizService'
import { supabase } from '../src/lib/supabase'
import { participantLogout } from '../src/lib/auth'

export default function ParticipantQuiz({ user, quiz, onLogout, onLeaveQuiz }) {
  const [participant, setParticipant] = useState(null)
  const [session, setSession] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [leaderboard, setLeaderboard] = useState([])
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [questionStartTime, setQuestionStartTime] = useState(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [lastAnswerResult, setLastAnswerResult] = useState(null)

  useEffect(() => {
    initializeQuiz()
  }, [])

  useEffect(() => {
    if (!participant) return

    // Realtime: session updates for this quiz
    const sessionSubscription = supabase
      .channel(`p_sessions_${quiz.id}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'quiz_sessions', filter: `quiz_id=eq.${quiz.id}` },
        (payload) => {
          if (payload?.new) {
            handleSessionUpdate(payload.new)
          } else {
            loadCurrentSession()
          }
        }
      )
      .subscribe()

    // Leaderboard bound to participant's session
    const leaderboardSubscription = participant.quiz_session_id
      ? supabase
          .channel(`p_leaderboard_${participant.quiz_session_id}`)
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'leaderboard', filter: `quiz_session_id=eq.${participant.quiz_session_id}` },
            () => loadLeaderboard()
          )
          .subscribe()
      : null

    return () => {
      sessionSubscription.unsubscribe()
      if (leaderboardSubscription) leaderboardSubscription.unsubscribe()
    }
  }, [participant?.quiz_session_id])

  useEffect(() => {
    if (session && session.session_status === 'question_active' && session.question_end_time) {
      const endTime = new Date(session.question_end_time).getTime()
      setQuestionStartTime(new Date(session.question_start_time).getTime())
      setHasAnswered(false)
      setSelectedAnswer(null)
      setLastAnswerResult(null)
      
      const timer = setInterval(() => {
        const now = Date.now()
        const remaining = Math.max(0, Math.ceil((endTime - now) / 1000))
        setTimeLeft(remaining)
        
        if (remaining === 0) {
          clearInterval(timer)
        }
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [session])

  const initializeQuiz = async () => {
    setLoading(true)
    const result = await joinQuiz(quiz.quiz_code, user.id)
    
    if (result.success) {
      setParticipant(result.participant)
      if (result.rejoined) {
        setError('Welcome back! Your previous score has been restored.')
        setTimeout(() => setError(''), 3000)
      }
      await loadCurrentSession()
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  const loadCurrentSession = async () => {
    const { data, error } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('quiz_id', quiz.id)
      .in('session_status', ['waiting', 'active', 'question_active', 'showing_leaderboard'])
      .order('started_at', { ascending: false })
      .limit(1)

    if (error) return

    const sessionData = Array.isArray(data) ? data[0] : data
    if (sessionData) {
      setSession(sessionData)
      await handleSessionUpdate(sessionData)
    }
  }

  const fetchCurrentQuestion = async (questionId) => {
    const { data, error } = await supabase
      .from('questions')
      .select(`*, question_options (*)`)
      .eq('id', questionId)
      .maybeSingle()
    if (!error && data) return data
    return null
  }

  const handleSessionUpdate = async (sessionData) => {
    setSession(sessionData)
    
    if (sessionData.session_status === 'question_active' && sessionData.current_question_id) {
      // Fetch the current question by id
      const { data, error } = await supabase
        .from('questions')
        .select('*, question_options (*)')
        .eq('id', sessionData.current_question_id)
        .maybeSingle()
      if (!error) {
        setCurrentQuestion(data)
        // After loading question, check if this participant already answered it
        await loadExistingAnswer(sessionData.current_question_id)
      }
      setShowLeaderboard(false)
    } else if (sessionData.session_status === 'showing_leaderboard') {
      setShowLeaderboard(true)
      setCurrentQuestion(null)
      loadLeaderboard()
    } else if (sessionData.session_status === 'completed') {
      setShowLeaderboard(true)
      setCurrentQuestion(null)
      loadLeaderboard()
    }
  }

  const loadExistingAnswer = async (questionId) => {
    if (!participant) return
    const { data, error } = await supabase
      .from('participant_answers')
      .select('selected_option_id, points_earned')
      .eq('participant_id', participant.id)
      .eq('question_id', questionId)
      .maybeSingle()
    if (!error && data) {
      setSelectedAnswer(data.selected_option_id)
      setHasAnswered(true)
      setLastAnswerResult(prev => prev || { pointsEarned: data.points_earned })
    }
  }

  // Fallback polling to avoid stale UI
  useEffect(() => {
    let poller
    if (participant) {
      poller = setInterval(() => {
        loadCurrentSession()
        if (participant.quiz_session_id) loadLeaderboard()
      }, 2000)
    }
    return () => { if (poller) clearInterval(poller) }
  }, [participant?.quiz_session_id])

  const loadLeaderboard = async () => {
    if (!participant) return
    
    const result = await getLeaderboard(participant.quiz_session_id)
    if (result.success) {
      setLeaderboard(result.leaderboard)
    }
  }

  const handleAnswerSubmit = async (optionId) => {
    if (hasAnswered || !questionStartTime || !participant || !currentQuestion) return

    const responseTime = Date.now() - questionStartTime
    setSelectedAnswer(optionId)
    setHasAnswered(true)

    const result = await submitAnswer(participant.id, currentQuestion.id, optionId, responseTime)
    
    if (result.success) {
      setLastAnswerResult(result)
      // Update participant score locally
      setParticipant(prev => ({ ...prev, total_score: result.totalScore }))
    } else {
      setError(result.error)
      setHasAnswered(false)
      setSelectedAnswer(null)
    }
  }

  const handleLogout = () => {
    participantLogout()
    onLogout()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-950 w-full bg-cover bg-center relative flex items-center justify-center"
        style={{ backgroundImage: "url('assets/cosmic-desktop.jpg')" }}
      >
        <div className="text-white text-xl">Joining quiz...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-blue-950 w-full bg-cover bg-center relative"
        style={{ backgroundImage: "url('assets/cosmic-desktop.jpg')" }}
      >
        <div className="relative z-10 p-6 max-w-5xl mx-auto space-y-6">
          {/* Top header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif text-white tracking-wider">{quiz.title}</h1>
              <div className="text-purple-300 text-sm">Code: {quiz.quiz_code}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-white font-bold text-lg">{participant?.total_score || 0} pts</div>
                <div className="text-gray-300 text-xs">Your Score</div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>

          {/* Centered content */}
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-slate-800/70 backdrop-blur-lg border border-purple-300/30 rounded-xl p-8 text-center max-w-md w-full shadow-xl">
              <h2 className="text-2xl font-serif text-white mb-4">Quiz Not Active</h2>
              <p className="text-gray-300 mb-6">This quiz session is not currently active. Please wait for the admin to start the quiz.</p>
              <div className="flex gap-4">
                <button
                  onClick={onLeaveQuiz}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showLeaderboard || session.session_status === 'showing_leaderboard' || session.session_status === 'completed') {
    const isCompleted = session.session_status === 'completed'
    const userPosition = leaderboard.find(entry => entry.participant_id === participant.id)

    return (
      <div className="min-h-screen bg-blue-950 w-full bg-cover bg-center relative"
        style={{ backgroundImage: "url('assets/cosmic-desktop.jpg')" }}
      >
        <div className="relative z-10 p-6 max-w-5xl mx-auto space-y-6">
          {/* Top header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-serif text-white tracking-wider">{quiz.title}</h1>
              <div className="text-purple-300 text-sm">{isCompleted ? 'Quiz Completed!' : 'Leaderboard'} • Code: {quiz.quiz_code}</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-white font-bold text-lg">{participant.total_score} pts</div>
                <div className="text-gray-300 text-sm">Your Score</div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>

          {/* User's Position */}
          {userPosition && (
            <div className="mb-8 bg-slate-800 bg-opacity-60 backdrop-blur-lg border border-purple-300 border-opacity-30 rounded-xl p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">#{userPosition.current_position}</div>
                <div className="text-gray-300">Your Position</div>
                {lastAnswerResult && (
                  <div className="mt-4 text-center">
                    <div className="text-green-400 font-medium">
                      Last Answer: +{lastAnswerResult.pointsEarned} points
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Leaderboard */}
          <div className="bg-slate-800/70 backdrop-blur-lg border border-purple-300/30 rounded-xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-6">
              <Trophy className="text-yellow-400" size={24} />
              <h2 className="text-2xl font-serif text-white">
                {isCompleted ? 'Final Results' : 'Current Standings'}
              </h2>
            </div>
            
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div key={entry.id} className={`flex items-center gap-4 p-4 rounded-lg ${
                  entry.participant_id === participant.id ? 'bg-purple-500 bg-opacity-30 border border-purple-400' :
                  index === 0 ? 'bg-yellow-500 bg-opacity-20 border border-yellow-500 border-opacity-30' :
                  index === 1 ? 'bg-gray-400 bg-opacity-20 border border-gray-400 border-opacity-30' :
                  index === 2 ? 'bg-orange-600 bg-opacity-20 border border-orange-600 border-opacity-30' :
                  'bg-slate-700 bg-opacity-50'
                }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-orange-600 text-white' :
                    'bg-slate-600 text-gray-300'
                  }`}>
                    {entry.current_position}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium flex items-center gap-2">
                      {entry.username}
                      {entry.participant_id === participant.id && (
                        <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full">You</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {entry.questions_answered} questions answered
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold text-lg">{entry.total_score}</div>
                    <div className="text-xs text-gray-400">points</div>
                  </div>
                </div>
              ))}
            </div>

            {!isCompleted && (
              <div className="mt-6 text-center text-gray-400">
                <p>Waiting for next question...</p>
              </div>
            )}

            {isCompleted && (
              <div className="mt-6 text-center">
                <p className="text-gray-300 mb-4">Thank you for participating!</p>
                <button
                  onClick={onLeaveQuiz}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300"
                >
                  Join Another Quiz
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (session.session_status === 'waiting') {
    return (
      <div className="min-h-screen bg-blue-950 w-full bg-cover bg-center relative"
        style={{ backgroundImage: "url('assets/cosmic-desktop.jpg')" }}
      >
        <div className="relative z-10 p-6 max-w-5xl mx-auto space-y-6">
          {/* Top header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif text-white tracking-wider">{quiz.title}</h1>
              <div className="text-purple-300 text-sm">Waiting Room • Code: {quiz.quiz_code}</div>
            </div>
            <div className="text-right">
              <div className="text-white font-bold text-lg">{participant.total_score} pts</div>
              <div className="text-gray-300 text-sm">Your Score</div>
            </div>
          </div>

          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-slate-800/70 backdrop-blur-lg border border-purple-300/30 rounded-xl p-8 text-center max-w-md w-full shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-white" size={24} />
              </div>
              <h2 className="text-2xl font-serif text-white mb-4">Get Ready!</h2>
              <p className="text-gray-300 mb-4">You've joined <strong>{quiz.title}</strong></p>
              <p className="text-gray-400 text-sm mb-6">Waiting for the quiz to start...</p>
              <div className="text-center">
                <div className="text-white font-bold text-lg">{participant.total_score} pts</div>
                <div className="text-gray-300 text-sm">Your Current Score</div>
              </div>
              <div className="mt-6 flex gap-4">
                <button
                  onClick={onLeaveQuiz}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Leave Quiz
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-blue-950 w-full bg-cover bg-center relative flex items-center justify-center"
        style={{ backgroundImage: "url('assets/cosmic-desktop.jpg')" }}
      >
        <div className="text-white text-xl">Loading question...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-950 w-full bg-cover bg-center relative"
      style={{ backgroundImage: "url('assets/cosmic-desktop.jpg')" }}
    >
      <div className="relative z-10 p-6 max-w-5xl mx-auto space-y-6">
        {/* Top header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-serif text-white tracking-wider">{quiz.title}</h1>
            <div className="text-purple-300 text-sm">Question {session.current_question_number} of {session.total_questions} • Code: {quiz.quiz_code}</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-yellow-400">
              <Clock size={20} />
              <span className="font-mono text-xl">{timeLeft}s</span>
            </div>
            <div className="text-right">
              <div className="text-white font-bold">{participant.total_score} pts</div>
              <div className="text-gray-300 text-sm">Score</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Progress */}
        <div className="flex justify-center">
          <div className="flex gap-2">
            {Array.from({ length: session.total_questions }, (_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  i < session.current_question_number ? 'bg-green-400' :
                  i === session.current_question_number - 1 ? 'bg-purple-400' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Question */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-800/70 backdrop-blur-lg border border-purple-300/30 rounded-xl p-8 shadow-xl">
            <h2 className="text-white text-xl font-light mb-8 text-center leading-relaxed">
              {currentQuestion.question_text}
            </h2>

            <div className="space-y-4">
              {currentQuestion.question_options
                ?.sort((a, b) => a.option_order - b.option_order)
                .map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswerSubmit(option.id)}
                    disabled={hasAnswered || timeLeft === 0}
                    className={`w-full p-4 rounded-xl text-left transition-all duration-300 ${
                      selectedAnswer === option.id
                        ? 'bg-purple-500 bg-opacity-50 border-2 border-purple-400 text-white'
                        : hasAnswered
                        ? 'bg-slate-700 bg-opacity-50 text-gray-400 cursor-not-allowed'
                        : 'bg-slate-700 bg-opacity-30 border border-slate-600 text-white hover:bg-slate-600 hover:bg-opacity-50 hover:border-purple-400 transform hover:scale-105'
                    } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                  >
                    <span className="block">{option.option_text}</span>
                  </button>
                ))}
            </div>

            {hasAnswered && lastAnswerResult && (
              <div className="mt-6 text-center">
                <div className="text-green-400 font-medium">
                  Answer submitted! +{lastAnswerResult.pointsEarned} points
                </div>
                <div className="text-gray-300 text-sm mt-1">
                  Waiting for other participants...
                </div>
              </div>
            )}

            {hasAnswered && !lastAnswerResult && (
              <div className="mt-6 text-center text-gray-300">
                Submitting answer...
              </div>
            )}

            {timeLeft === 0 && !hasAnswered && (
              <div className="mt-6 text-center text-red-400">
                Time's up! Waiting for next question...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
