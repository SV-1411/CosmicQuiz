import { supabase } from './supabase'

// Generate random quiz code
const generateQuizCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Quiz management functions
export const createQuiz = async (title, description) => {
  try {
    const quizCode = generateQuizCode()
    
    const { data, error } = await supabase
      .from('quizzes')
      .insert([
        {
          title,
          description,
          quiz_code: quizCode,
          status: 'draft'
        }
      ])
      .select()

    if (error) {
      console.error('Error creating quiz:', error)
      throw error
    }

    const createdQuiz = Array.isArray(data) ? data[0] : data
    return { success: true, quiz: createdQuiz }
  } catch (error) {
    console.error('Error in createQuiz:', error)
    return { success: false, error: error.message }
  }
}

export const getQuizzes = async () => {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, quizzes: data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const getQuizById = async (quizId) => {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select(`
        *,
        questions (
          *,
          question_options (*)
        )
      `)
      .eq('id', quizId)
      .single()

    if (error) throw error
    return { success: true, quiz: data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const getQuizByCode = async (quizCode) => {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('quiz_code', quizCode)
      .single()

    if (error) throw error
    return { success: true, quiz: data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const updateQuizStatus = async (quizId, status) => {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', quizId)
      .select()
      .single()

    if (error) throw error
    return { success: true, quiz: data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Question management
export const addQuestion = async (quizId, questionText, options, timeLimit = 10, points = 10) => {
  try {
    // Get current question count for ordering
    const { data: existingQuestions, error: countError } = await supabase
      .from('questions')
      .select('question_order')
      .eq('quiz_id', quizId)
      .order('question_order', { ascending: false })
      .limit(1)

    if (countError) {
      console.error('Error getting question count:', countError)
    }

    const nextOrder = existingQuestions && existingQuestions.length > 0 ? existingQuestions[0].question_order + 1 : 1

    // Insert question
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .insert([
        {
          quiz_id: quizId,
          question_text: questionText,
          question_order: nextOrder,
          time_limit: timeLimit,
          points: points
        }
      ])
      .select()

    if (questionError) {
      console.error('Error inserting question:', questionError)
      throw questionError
    }

    const insertedQuestion = Array.isArray(question) ? question[0] : question

    // Insert options
    const optionsData = options.map((option, index) => ({
      question_id: insertedQuestion.id,
      option_text: option.text,
      is_correct: option.isCorrect,
      option_order: index + 1
    }))

    const { error: optionsError } = await supabase
      .from('question_options')
      .insert(optionsData)

    if (optionsError) {
      console.error('Error inserting options:', optionsError)
      throw optionsError
    }

    return { success: true, question: insertedQuestion }
  } catch (error) {
    console.error('Error in addQuestion:', error)
    return { success: false, error: error.message }
  }
}

// Quiz session management
export const restartQuiz = async (quizId) => {
  try {
    // Mark existing sessions completed
    await supabase
      .from('quiz_sessions')
      .update({ session_status: 'completed', updated_at: new Date().toISOString() })
      .eq('quiz_id', quizId)
      .in('session_status', ['waiting','active','question_active','showing_leaderboard'])

    // Reset quiz status to draft so admin can start again
    await updateQuizStatus(quizId, 'draft')

    return { success: true }
  } catch (error) {
    console.error('Error restarting quiz:', error)
    return { success: false, error: error.message }
  }
}

export const stopQuiz = async (sessionId, quizId) => {
  try {
    await supabase
      .from('quiz_sessions')
      .update({ session_status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', sessionId)

    await updateQuizStatus(quizId, 'completed')
    return { success: true }
  } catch (error) {
    console.error('Error stopping quiz:', error)
    return { success: false, error: error.message }
  }
}

export const deleteQuiz = async (quizId) => {
  try {
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error deleting quiz:', error)
    return { success: false, error: error.message }
  }
}

// Quiz session management
export const startQuizSession = async (quizId) => {
  try {
    // Get quiz questions count
    const { data: questions } = await supabase
      .from('questions')
      .select('id')
      .eq('quiz_id', quizId)
      .order('question_order')

    if (!questions || questions.length === 0) {
      throw new Error('Quiz has no questions')
    }

    // Create quiz session
    const { data: session, error } = await supabase
      .from('quiz_sessions')
      .insert([
        {
          quiz_id: quizId,
          total_questions: questions.length,
          session_status: 'waiting'
        }
      ])
      .select()
      .single()

    if (error) throw error

    // Update quiz status to active
    await updateQuizStatus(quizId, 'active')

    return { success: true, session }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const getActiveSession = async (quizId) => {
  try {
    const { data, error } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('quiz_id', quizId)
      .in('session_status', ['waiting', 'active', 'question_active', 'showing_leaderboard'])
      .order('started_at', { ascending: false })
      .limit(1)

    if (error && error.code !== 'PGRST116') throw error
    
    // Return the first item if array, or null if no data
    const session = Array.isArray(data) ? data[0] : data
    return { success: true, session }
  } catch (error) {
    console.error('Error getting active session:', error)
    return { success: false, error: error.message }
  }
}

export const startNextQuestion = async (sessionId) => {
  try {
    // Get current session
    const { data: session } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (!session) throw new Error('Session not found')

    // Get next question
    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', session.quiz_id)
      .order('question_order')
      .limit(1)
      .gt('question_order', session.current_question_number)

    if (!questions || questions.length === 0) {
      // No more questions, end quiz
      await supabase
        .from('quiz_sessions')
        .update({ 
          session_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)

      await updateQuizStatus(session.quiz_id, 'completed')
      
      return { success: true, completed: true }
    }

    const nextQuestion = questions[0]
    const questionStartTime = new Date().toISOString()
    const questionEndTime = new Date(Date.now() + nextQuestion.time_limit * 1000).toISOString()

    // Update session with current question
    const { data: updatedSession, error } = await supabase
      .from('quiz_sessions')
      .update({
        current_question_id: nextQuestion.id,
        current_question_number: nextQuestion.question_order,
        session_status: 'question_active',
        question_start_time: questionStartTime,
        question_end_time: questionEndTime,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) throw error

    return { success: true, session: updatedSession, question: nextQuestion }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const endCurrentQuestion = async (sessionId) => {
  try {
    const { data, error } = await supabase
      .from('quiz_sessions')
      .update({
        session_status: 'showing_leaderboard',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) throw error
    return { success: true, session: data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Participant functions
export const joinQuiz = async (quizCode, userId) => {
  try {
    // Get quiz and active session
    const { data: quiz } = await supabase
      .from('quizzes')
      .select('id')
      .eq('quiz_code', quizCode)
      .single()

    if (!quiz) throw new Error('Quiz not found')

    const { data: session } = await supabase
      .from('quiz_sessions')
      .select('id')
      .eq('quiz_id', quiz.id)
      .in('session_status', ['waiting', 'active', 'question_active', 'showing_leaderboard'])
      .order('started_at', { ascending: false })
      .limit(1)

    const activeSession = Array.isArray(session) ? session[0] : session
    if (!activeSession) throw new Error('No active session for this quiz')

    // Get user info
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('username')
      .eq('id', userId)
      .maybeSingle()

    if (userErr) throw userErr
    if (!user) throw new Error('User not found. Please log in again.')

    // Check if already joined
    const { data: existing, error: existingErr } = await supabase
      .from('participants')
      .select('id, total_score, quiz_session_id, username')
      .eq('quiz_session_id', activeSession.id)
      .eq('user_id', userId)
      .maybeSingle()

    if (existingErr) throw existingErr
    if (existing) {
      // Update last active
      await supabase
        .from('participants')
        .update({ last_active: new Date().toISOString() })
        .eq('id', existing.id)

      return { success: true, participant: existing, rejoined: true }
    }

    // Join as new participant (use upsert to avoid duplicate key race)
    const { data: participant, error } = await supabase
      .from('participants')
      .upsert([
        {
          quiz_session_id: activeSession.id,
          user_id: userId,
          username: user.username,
          last_active: new Date().toISOString(),
          joined_at: new Date().toISOString()
        }
      ], { onConflict: 'quiz_session_id,user_id' })
      .select()
      .maybeSingle()

    if (error) throw error

    return { success: true, participant, rejoined: false }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const submitAnswer = async (participantId, questionId, optionId, responseTime) => {
  try {
    // Get question details for scoring
    const { data: question } = await supabase
      .from('questions')
      .select('points, time_limit')
      .eq('id', questionId)
      .single()

    // Get option details
    const { data: option } = await supabase
      .from('question_options')
      .select('is_correct')
      .eq('id', optionId)
      .single()

    if (!question || !option) throw new Error('Question or option not found')

    // Calculate points using the database function
    let pointsEarned = 0
    if (option.is_correct) {
      const { data: pointsResult } = await supabase
        .rpc('calculate_points', {
          base_points: question.points,
          time_limit: question.time_limit,
          response_time: responseTime
        })
      
      pointsEarned = pointsResult || 0
    }

    // Upsert answer to avoid duplicate key on (participant_id, question_id)
    const { data: answer, error } = await supabase
      .from('participant_answers')
      .upsert([
        {
          participant_id: participantId,
          question_id: questionId,
          selected_option_id: optionId,
          is_correct: option.is_correct,
          response_time: responseTime,
          points_earned: pointsEarned,
          answered_at: new Date().toISOString()
        }
      ], { onConflict: 'participant_id,question_id' })
      .select()
      .maybeSingle()

    if (error) throw error

    // Update participant total score
    const { data: participantAnswers } = await supabase
      .from('participant_answers')
      .select('points_earned')
      .eq('participant_id', participantId)

    const totalScore = participantAnswers.reduce((sum, ans) => sum + ans.points_earned, 0)

    await supabase
      .from('participants')
      .update({ 
        total_score: totalScore,
        last_active: new Date().toISOString()
      })
      .eq('id', participantId)

    return { success: true, answer, pointsEarned, totalScore }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const getLeaderboard = async (sessionId) => {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('quiz_session_id', sessionId)
      .order('current_position')

    if (error) throw error
    return { success: true, leaderboard: data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
