import 'bootstrap/dist/css/bootstrap.min.css'
import Signup from './User/Signup'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './User/Login'
import LoginBack from './Admin/LoginBack'
import UserBack from './Admin/UserBack'



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/register' element={<Signup />} />
        <Route path='/login' element={<Login />} />
        <Route path='/loginBack' element={<LoginBack />} />
        <Route path='/admin/user' element={<UserBack />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
