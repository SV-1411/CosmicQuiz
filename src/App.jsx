import React from 'react'
import CosmicQuizEntry from '../components/cosmicEntry'
import CosmicQuizDemo from '../components/CosmicQuiz'
import QuizWrapper from '../components/QuizWrapper'

import { Routes,Route } from 'react-router-dom'
import CongratulationsScreen from '../components/cosmicEnd'

function App() {
  return (
    <div className='bg-cosmic min-h-screen w-full'>
      <Routes>
        <Route path = "/" element={<CosmicQuizEntry/>} />
        <Route path = "/questions" element={<QuizWrapper/>} />
        <Route path = "/end" element={<CongratulationsScreen/>} />

      </Routes>
    </div>
  )
}

export default App
