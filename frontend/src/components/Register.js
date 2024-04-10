import React, { useEffect, useState } from 'react';
import logo from '../images/icons/hh_logo.png';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast'
import { register, reset } from '../features/auth/authSlice';
import Spinner from './Spinner';
import { Link } from 'react-router-dom';

const Register = () => {
const [formData, setFormData] = useState({name: '', email: '', password: '', password2: ''})
const {name, email, password, password2} = formData

const navigate = useNavigate()
const dispatch = useDispatch()

const {clerk, isLoading, isError, isSuccess, message} = useSelector(state => state.auth)

useEffect(() => {
    if (isError) toast.error(message,{
        style:{
            border:'2px solid #841617',
            padding:'16px',
            color:'#000000',
            }})
    if (isSuccess || clerk) navigate('/')
    dispatch(reset())
}, [clerk, isError, isSuccess, message, navigate, dispatch])

const onChange = e => {
    setFormData(prevState =>({
        ...prevState,
        [e.target.name]: e.target.value
    }))
}

const onSubmit = e => {
    e.preventDefault();
    if (password !== password2) {
        toast.error('Passwords are different');
    } else {
        const clerkData = { name: name.toLowerCase(), email, password }; // Corrected line
        dispatch(register(clerkData));
    }
}

    return (
        isLoading? <Spinner/>:(
            <>
        <div className="Register" style={{ zIndex: 9999 }}>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
                <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&display=swap" rel="stylesheet" />
                <link rel="stylesheet" href="styles.css" />
                <title>Login Page</title>
            </head>
            <body>
                <div className="register-container">
                    <img src={logo} alt="Company Logo" className="center-image" />
                    <h4><i>Log in Portal</i></h4>
                    <form onSubmit={onSubmit}>
                        <label htmlFor="">Full Name</label><br />
                        <input type="text" name="name" id="name" required onChange={onChange} value={name}/><br />

                        <label htmlFor="">Email</label><br />
                        <input type="email"  name="email" id="email" required onChange={onChange} value={email}/><br />

                        <label htmlFor="password">Password</label><br />
                        <input type="password" name="password" id="password" onChange={onChange} value={password}/><br />

                        <label htmlFor="">Confirm Password</label><br />
                        <input type="password" name="password2" id="password2" required onChange={onChange} value={password2}/><br />
                        <div className='submit-btn'>
                        <button type="submit" value="Register"> Register </button>
                        </div>
                    </form>
                    <Link to='/login'>
                    <button className='link-to-register'>Log in to your account</button>
                    </Link>
                </div>
            </body>
        </div>
    </>
    )
)};


export default Register;
