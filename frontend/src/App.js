import logo from './logo.svg';
import Login from './components/Login'
import Register from './components/Register';
import CheckOutForm from './components/CheckOutForm';
import Dashboard from './components/Dashboard';
import Spinner from './components/Spinner';
import CheckInForm from './components/CheckInForm';
import AddNewGuest from './components/AddNewGuest';
import toast, { Toaster } from 'react-hot-toast';
import './App.css';
import {BrowserRouter as Router, Routes, Route} from "react-router-dom"

function App() {
  return (
    <>
      <Router>
      <div className="container">
        <Routes>
          <Route path='/login' element={<Login />} /> {/* Render Login component first */}
          <Route path='/' element={<Dashboard />} />
          <Route path='/register' element={<Register />} />
        </Routes>
      </div>
    </Router>
      <Toaster/>
      </>
    
  );
}

export default App;
