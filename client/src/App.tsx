import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import './App.css'
import Register from './components/Register'

function App() {
  return(
    <BrowserRouter>
      <Routes>
      <Route path = "/" element ={<Register/>}/>
      <Route path = "/register" element = {<Register/>}/>
    </Routes>
    </BrowserRouter>
  )
}

export default App
