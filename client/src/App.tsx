import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import './App.css'
import Register from './components/Register'
import Dashboard from './components/Dashboard-2'
import Header from './components/Header'
import Login from './components/Login'
import ResetPassword from './components/ResetPassword'
import StockInfo from './components/StockInfo'

function App() {
  return(
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path = "/" element ={<Dashboard />}/>
        <Route path ="/dashboard" element ={<Dashboard/>}/>
        <Route path = "/register" element = {<Register />}/>
        <Route path = "/login" element = {<Login />} />
        <Route path ="/reset-password" element = {<ResetPassword/>}/>
        <Route path="/stock/:stockId/:timeRange" element={<StockInfo />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
