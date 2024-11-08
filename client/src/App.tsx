import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import './App.css'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import Header from './components/Header'


function App() {
  return(
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path = "/" element ={<Dashboard />}/>
        <Route path = "/register" element = {<Register />}/>
        <Route path = "/login" /*element = {<Login />}*/ />
      </Routes>
    </BrowserRouter>
  )
}

export default App
