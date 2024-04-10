import React, { useEffect, useState } from 'react';
import logo from '../images/icons/hh_logo.png';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Spinner from './Spinner';
import { toast } from 'react-hot-toast'
import {login, reset} from "../features/auth/authSlice"

const Login = () => {
const [formData, setFormData] = useState({clerkID:'', password:''})
const {clerkCred, password} = formData

const navigate = useNavigate()
const dispatch = useDispatch()

const {clerk, isLoading, isError, isSuccess, message} = useSelector(state => state.auth)

useEffect(()=>{
    if (isError) toast.error(message,{
        style:{
            border:'2px solid #841617',
            padding:'16px',
            color:'#000000',
            }})
    if (isSuccess || clerk) navigate('/')
    dispatch(reset()) 
}, [clerk, isError, isSuccess, message, navigate, dispatch])

const onChange = e =>{
    setFormData(prevState =>({
        ...prevState, 
        [e.target.name]: e.target.value
    }))
}
const onSubmit = e =>{
    e.preventDefault()
    const clerkData = {clerkCred, password}
    dispatch(login(clerkData))
}

    return (
        isLoading ? <Spinner/>:(
        <>
        <div className="Login">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
                <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&display=swap" rel="stylesheet" />
                <title>Login Page</title>
            </head>
            <body>
                <div className="login-container">
                    <img src={logo} alt="Company Logo" className="center-image" />
                    <h4><i>Log in Portal</i></h4>
                    <form onSubmit={onSubmit}>
                        <label htmlFor="clerkCred">User ID</label><br />
                        <input type="text" name="clerkCred" id="clerkCred" required onChange={onChange} /><br />
                        <a href="#">Forgot User ID?</a><br />
                        <label htmlFor="password" className='login-password'>Password</label><br />
                        <input type="password" name="password" id="password" required onChange={onChange}/><br />
                        <a href="#">Forgot Password?</a><br />
                        <div className='submit-btn'>
                        <button type="submit" value="login"> Log in </button>
                        </div>
                    </form>
                    <Link to='/register'>
                    <button className='link-to-register' >Create an account</button>
                    </Link>
                </div>
            </body>
        </div>
        </>
    )
    )
};

export default Login;
