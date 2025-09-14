-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS public.leaderboard CASCADE;
DROP TABLE IF EXISTS public.participant_answers CASCADE;
DROP TABLE IF EXISTS public.participants CASCADE;
DROP TABLE IF EXISTS public.quiz_sessions CASCADE;
DROP TABLE IF EXISTS public.question_options CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.quizzes CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Users table for participant authentication
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by VARCHAR(100) DEFAULT 'admin',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'waiting', 'active', 'completed')),
    quiz_code VARCHAR(10) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_order INTEGER NOT NULL,
    time_limit INTEGER NOT NULL DEFAULT 10, -- seconds
    points INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Question options table
CREATE TABLE IF NOT EXISTS public.question_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    option_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz sessions table (tracks active quiz sessions)
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    current_question_id UUID REFERENCES public.questions(id),
    current_question_number INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    session_status VARCHAR(20) DEFAULT 'waiting' CHECK (session_status IN ('waiting', 'active', 'question_active', 'showing_leaderboard', 'completed')),
    question_start_time TIMESTAMP WITH TIME ZONE,
    question_end_time TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Participants table (tracks who joined which quiz)
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_session_id UUID REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    total_score INTEGER DEFAULT 0,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(quiz_session_id, user_id)
);

-- Participant answers table
CREATE TABLE IF NOT EXISTS public.participant_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    selected_option_id UUID REFERENCES public.question_options(id),
    is_correct BOOLEAN DEFAULT FALSE,
    response_time INTEGER, -- milliseconds from question start
    points_earned INTEGER DEFAULT 0,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(participant_id, question_id)
);

-- Leaderboard view (real-time leaderboard data)
CREATE TABLE IF NOT EXISTS public.leaderboard (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_session_id UUID REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    total_score INTEGER DEFAULT 0,
    current_position INTEGER DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(quiz_session_id, participant_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quizzes_code ON public.quizzes(quiz_code);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON public.questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_questions_order ON public.questions(quiz_id, question_order);
CREATE INDEX IF NOT EXISTS idx_participants_session ON public.participants(quiz_session_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_session ON public.leaderboard(quiz_session_id, total_score DESC);
CREATE INDEX IF NOT EXISTS idx_participant_answers_participant ON public.participant_answers(participant_id);

-- Disable RLS for easier development (enable later for production)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard DISABLE ROW LEVEL SECURITY;

-- Function to update leaderboard
CREATE OR REPLACE FUNCTION update_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert leaderboard entry using SUM of points_earned (not participants.total_score)
    INSERT INTO public.leaderboard (quiz_session_id, participant_id, username, total_score, questions_answered)
    SELECT 
        p.quiz_session_id,
        p.id,
        p.username,
        COALESCE(SUM(pa.points_earned), 0) AS total_score,
        COUNT(pa.id) AS questions_answered
    FROM public.participants p
    LEFT JOIN public.participant_answers pa ON p.id = pa.participant_id
    WHERE p.id = NEW.participant_id
    GROUP BY p.quiz_session_id, p.id, p.username
    ON CONFLICT (quiz_session_id, participant_id)
    DO UPDATE SET
        total_score = EXCLUDED.total_score,
        questions_answered = EXCLUDED.questions_answered,
        updated_at = NOW();

    -- Update positions based on latest totals
    WITH ranked_participants AS (
        SELECT 
            id,
            ROW_NUMBER() OVER (PARTITION BY quiz_session_id ORDER BY total_score DESC, updated_at ASC) as position
        FROM public.leaderboard
        WHERE quiz_session_id = (SELECT quiz_session_id FROM public.participants WHERE id = NEW.participant_id)
    )
    UPDATE public.leaderboard
    SET current_position = ranked_participants.position
    FROM ranked_participants
    WHERE public.leaderboard.id = ranked_participants.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update leaderboard when participant answers
CREATE OR REPLACE TRIGGER trigger_update_leaderboard
    AFTER INSERT OR UPDATE ON public.participant_answers
    FOR EACH ROW
    EXECUTE FUNCTION update_leaderboard();

-- Function to calculate points based on response time
CREATE OR REPLACE FUNCTION calculate_points(base_points INTEGER, time_limit INTEGER, response_time INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- Points decrease linearly with time
    -- First 20% of time gets full points
    -- Points decrease to 60% of base points at time limit
    IF response_time <= (time_limit * 0.2 * 1000) THEN
        RETURN base_points;
    ELSE
        RETURN GREATEST(
            ROUND(base_points * (1 - 0.4 * (response_time / 1000.0 - time_limit * 0.2) / (time_limit * 0.8))),
            ROUND(base_points * 0.6)
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
