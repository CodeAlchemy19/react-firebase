import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Subscribe from './components/Subscribe'
import GroupSubscribe from './components/GroupSubscribe'
import Payment from './components/Payment'
import { CssBaseline } from '@mui/material'
import { useEffect, useState } from 'react'

function App() {
  const user = localStorage.getItem("user");

  return (
    <Router>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/subscribe" element={<Subscribe />} />
        <Route path="/group-subscribe" element={<GroupSubscribe />} />
        <Route path="/payment" element={<Payment />} />
      </Routes>
    </Router>
  )
}
export default App
