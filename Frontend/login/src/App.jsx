import { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import Signup from './signup'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Login from './Login'
import Navbar from './Navbar'
import Footer from './Footer'
import Home from './Home'
import Why from './why'
import Team from './team'
import Service from './Service'
import About from './About'


function App() {
  

  return (
  <BrowserRouter>
  <Routes>
    <Route path='/register' element={<Signup />}></Route>
    <Route path='/login' element={<Login />}></Route>
    <Route path='/home' element={<Home />}></Route>
    <Route path='/footer' element={<Footer />}></Route>
    <Route path='/why' element={<Why />}></Route>
    <Route path='/team' element={<Team />}></Route>
    <Route path='/service' element={<Service />}></Route>
    <Route path='/about' element={<About />}></Route>

  </Routes>
  </BrowserRouter>
  )
}

export default App
