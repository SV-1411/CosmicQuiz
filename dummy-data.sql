-- Insert dummy quiz data
INSERT INTO public.quizzes (title, description, quiz_code, status) VALUES
('Space Exploration Quiz', 'Test your knowledge about space, planets, and the universe!', 'SPACE1', 'draft'),
('Science Fundamentals', 'Basic science questions covering physics, chemistry, and biology', 'SCI101', 'draft'),
('General Knowledge Challenge', 'Mixed questions from various topics', 'GENKNW', 'draft');

-- Get the quiz IDs for reference (you'll need to replace these with actual IDs after running the above)
-- For Space Exploration Quiz
INSERT INTO public.questions (quiz_id, question_text, question_order, time_limit, points) VALUES
((SELECT id FROM public.quizzes WHERE quiz_code = 'SPACE1'), 'Which planet is known as the Red Planet?', 1, 15, 10),
((SELECT id FROM public.quizzes WHERE quiz_code = 'SPACE1'), 'What is the largest planet in our solar system?', 2, 12, 10),
((SELECT id FROM public.quizzes WHERE quiz_code = 'SPACE1'), 'How many moons does Earth have?', 3, 10, 10),
((SELECT id FROM public.quizzes WHERE quiz_code = 'SPACE1'), 'What is the closest star to Earth?', 4, 15, 10),
((SELECT id FROM public.quizzes WHERE quiz_code = 'SPACE1'), 'Which space agency launched the Hubble Space Telescope?', 5, 20, 15);

-- Options for Question 1: Which planet is known as the Red Planet?
INSERT INTO public.question_options (question_id, option_text, is_correct, option_order) VALUES
((SELECT id FROM public.questions WHERE question_text = 'Which planet is known as the Red Planet?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SPACE1')), 'Mars', true, 1),
((SELECT id FROM public.questions WHERE question_text = 'Which planet is known as the Red Planet?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SPACE1')), 'Venus', false, 2),
((SELECT id FROM public.questions WHERE question_text = 'Which planet is known as the Red Planet?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SPACE1')), 'Jupiter', false, 3),
((SELECT id FROM public.questions WHERE question_text = 'Which planet is known as the Red Planet?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SPACE1')), 'Saturn', false, 4);

-- Options for Question 2: What is the largest planet in our solar system?
INSERT INTO public.question_options (question_id, option_text, is_correct, option_order) VALUES
((SELECT id FROM public.questions WHERE question_text = 'What is the largest planet in our solar system?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SPACE1')), 'Jupiter', true, 1),
((SELECT id FROM public.questions WHERE question_text = 'What is the largest planet in our solar system?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SPACE1')), 'Saturn', false, 2),
((SELECT id FROM public.questions WHERE question_text = 'What is the largest planet in our solar system?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SPACE1')), 'Neptune', false, 3),
((SELECT id FROM public.questions WHERE question_text = 'What is the largest planet in our solar system?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SPACE1')), 'Earth', false, 4);

-- Options for Question 3: How many moons does Earth have?
INSERT INTO public.question_options (question_id, option_text, is_correct, option_order) VALUES
((SELECT id FROM public.questions WHERE question_text = 'How many moons does Earth have?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SPACE1')), '1', true, 1),
((SELECT id FROM public.questions WHERE question_text = 'How many moons does Earth have?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SPACE1')), '2', false, 2),
((SELECT id FROM public.questions WHERE question_text = 'How many moons does Earth have?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SPACE1')), '0', false, 3),
((SELECT id FROM public.questions WHERE question_text = 'How many moons does Earth have?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SPACE1')), '3', false, 4);

-- Options for Question 4: What is the closest star to Earth?
INSERT INTO public.question_options (question_id, option_text, is_correct, option_order) VALUES
((SELECT id FROM public.questions WHERE question_text = 'What is the closest star to Earth?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SPACE1')), 'The Sun', true, 1),
((SELECT id FROM public.questions WHERE question_text = 'What is the closest star to Earth?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SPACE1')), 'Proxima Centauri', false, 2),
((SELECT id FROM public.questions WHERE question_text = 'What is the closest star to Earth?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SPACE1')), 'Alpha Centauri', false, 3),
((SELECT id FROM public.questions WHERE question_text = 'What is the closest star to Earth?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SPACE1')), 'Sirius', false, 4);

-- Options for Question 5: Which space agency launched the Hubble Space Telescope?
INSERT INTO public.question_options (question_id, option_text, is_correct, option_order) VALUES
((SELECT id FROM public.questions WHERE question_text = 'Which space agency launched the Hubble Space Telescope?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SPACE1')), 'NASA', true, 1),
((SELECT id FROM public.questions WHERE question_text = 'Which space agency launched the Hubble Space Telescope?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SPACE1')), 'ESA', false, 2),
((SELECT id FROM public.questions WHERE question_text = 'Which space agency launched the Hubble Space Telescope?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SPACE1')), 'ROSCOSMOS', false, 3),
((SELECT id FROM public.questions WHERE question_text = 'Which space agency launched the Hubble Space Telescope?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SPACE1')), 'JAXA', false, 4);

-- For Science Fundamentals Quiz
INSERT INTO public.questions (quiz_id, question_text, question_order, time_limit, points) VALUES
((SELECT id FROM public.quizzes WHERE quiz_code = 'SCI101'), 'What is the chemical symbol for gold?', 1, 12, 10),
((SELECT id FROM public.quizzes WHERE quiz_code = 'SCI101'), 'What force keeps planets in orbit around the sun?', 2, 15, 10),
((SELECT id FROM public.quizzes WHERE quiz_code = 'SCI101'), 'What is the powerhouse of the cell?', 3, 10, 10),
((SELECT id FROM public.quizzes WHERE quiz_code = 'SCI101'), 'At what temperature does water boil at sea level?', 4, 12, 10);

-- Options for Science questions
INSERT INTO public.question_options (question_id, option_text, is_correct, option_order) VALUES
-- What is the chemical symbol for gold?
((SELECT id FROM public.questions WHERE question_text = 'What is the chemical symbol for gold?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SCI101')), 'Au', true, 1),
((SELECT id FROM public.questions WHERE question_text = 'What is the chemical symbol for gold?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SCI101')), 'Ag', false, 2),
((SELECT id FROM public.questions WHERE question_text = 'What is the chemical symbol for gold?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SCI101')), 'Go', false, 3),
((SELECT id FROM public.questions WHERE question_text = 'What is the chemical symbol for gold?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SCI101')), 'Gd', false, 4),

-- What force keeps planets in orbit around the sun?
((SELECT id FROM public.questions WHERE question_text = 'What force keeps planets in orbit around the sun?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SCI101')), 'Gravity', true, 1),
((SELECT id FROM public.questions WHERE question_text = 'What force keeps planets in orbit around the sun?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SCI101')), 'Magnetism', false, 2),
((SELECT id FROM public.questions WHERE question_text = 'What force keeps planets in orbit around the sun?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SCI101')), 'Centrifugal force', false, 3),
((SELECT id FROM public.questions WHERE question_text = 'What force keeps planets in orbit around the sun?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SCI101')), 'Nuclear force', false, 4),

-- What is the powerhouse of the cell?
((SELECT id FROM public.questions WHERE question_text = 'What is the powerhouse of the cell?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SCI101')), 'Mitochondria', true, 1),
((SELECT id FROM public.questions WHERE question_text = 'What is the powerhouse of the cell?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SCI101')), 'Nucleus', false, 2),
((SELECT id FROM public.questions WHERE question_text = 'What is the powerhouse of the cell?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SCI101')), 'Ribosome', false, 3),
((SELECT id FROM public.questions WHERE question_text = 'What is the powerhouse of the cell?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SCI101')), 'Chloroplast', false, 4),

-- At what temperature does water boil at sea level?
((SELECT id FROM public.questions WHERE question_text = 'At what temperature does water boil at sea level?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SCI101')), '100°C', true, 1),
((SELECT id FROM public.questions WHERE question_text = 'At what temperature does water boil at sea level?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SCI101')), '90°C', false, 2),
((SELECT id FROM public.questions WHERE question_text = 'At what temperature does water boil at sea level?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SCI101')), '110°C', false, 3),
((SELECT id FROM public.questions WHERE question_text = 'At what temperature does water boil at sea level?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'SCI101')), '120°C', false, 4);

-- For General Knowledge Quiz
INSERT INTO public.questions (quiz_id, question_text, question_order, time_limit, points) VALUES
((SELECT id FROM public.quizzes WHERE quiz_code = 'GENKNW'), 'Which country is known as the Land of the Rising Sun?', 1, 15, 10),
((SELECT id FROM public.quizzes WHERE quiz_code = 'GENKNW'), 'Who painted the Mona Lisa?', 2, 12, 10),
((SELECT id FROM public.quizzes WHERE quiz_code = 'GENKNW'), 'What is the capital of Australia?', 3, 15, 10);

-- Options for General Knowledge questions
INSERT INTO public.question_options (question_id, option_text, is_correct, option_order) VALUES
-- Which country is known as the Land of the Rising Sun?
((SELECT id FROM public.questions WHERE question_text = 'Which country is known as the Land of the Rising Sun?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'GENKNW')), 'Japan', true, 1),
((SELECT id FROM public.questions WHERE question_text = 'Which country is known as the Land of the Rising Sun?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'GENKNW')), 'China', false, 2),
((SELECT id FROM public.questions WHERE question_text = 'Which country is known as the Land of the Rising Sun?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'GENKNW')), 'South Korea', false, 3),
((SELECT id FROM public.questions WHERE question_text = 'Which country is known as the Land of the Rising Sun?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'GENKNW')), 'Thailand', false, 4),

-- Who painted the Mona Lisa?
((SELECT id FROM public.questions WHERE question_text = 'Who painted the Mona Lisa?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'GENKNW')), 'Leonardo da Vinci', true, 1),
((SELECT id FROM public.questions WHERE question_text = 'Who painted the Mona Lisa?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'GENKNW')), 'Michelangelo', false, 2),
((SELECT id FROM public.questions WHERE question_text = 'Who painted the Mona Lisa?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'GENKNW')), 'Pablo Picasso', false, 3),
((SELECT id FROM public.questions WHERE question_text = 'Who painted the Mona Lisa?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'GENKNW')), 'Vincent van Gogh', false, 4),

-- What is the capital of Australia?
((SELECT id FROM public.questions WHERE question_text = 'What is the capital of Australia?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'GENKNW')), 'Canberra', true, 1),
((SELECT id FROM public.questions WHERE question_text = 'What is the capital of Australia?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'GENKNW')), 'Sydney', false, 2),
((SELECT id FROM public.questions WHERE question_text = 'What is the capital of Australia?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'GENKNW')), 'Melbourne', false, 3),
((SELECT id FROM public.questions WHERE question_text = 'What is the capital of Australia?' AND quiz_id = (SELECT id FROM public.quizzes WHERE quiz_code = 'GENKNW')), 'Brisbane', false, 4);
