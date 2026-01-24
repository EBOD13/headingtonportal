// frontend/src/components/Register.jsx
import React, { useEffect, useState } from 'react';
import logo from '../images/icons/hh_logo.png';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  register,
  reset,
  adminCreateClerk,
} from '../features/auth/authSlice';
import Spinner from './Spinner';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: '',
  });
  const { name, email, password, password2 } = formData;

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { clerk, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  // Was this navigation initiated from the admin screen?
  const fromAdmin = Boolean(location.state?.fromAdmin);

useEffect(() => {
  if (isError) {
    toast.error(message || 'Registration failed', {
      style: {
        border: '2px solid #841617',
        padding: '16px',
        color: '#000000',
      },
    });
    dispatch(reset());  // Only reset after showing error
  }

  if (isSuccess) {
    if (fromAdmin) {
      toast.success('Clerk account created successfully');
      navigate('/admin/clerks');
    } else {
      navigate('/');
    }
    dispatch(reset());  // Only reset after success actions
  }

  // If user hits /register directly while already logged in,
  // only redirect them in the normal (non-admin) case.
  if (!fromAdmin && clerk) {
    navigate('/');
  }
  
}, [clerk, isError, isSuccess, message, navigate, dispatch, fromAdmin]);


  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();

    if (!name || !email) {
      toast.error('Name and email are required');
      return;
    }

    // Admin flow: create clerk without password
    if (fromAdmin) {
      const clerkData = {
        name: name.trim(),
        email: email.trim(),
      };
      dispatch(adminCreateClerk(clerkData));
      return;
    }

    // Normal self-registration flow:
    if (password !== password2) {
      toast.error('Passwords are different');
      return;
    }

    const clerkData = {
      name: name.toLowerCase(),
      email,
      password,
    };

    try {
      dispatch(register(clerkData));
    } catch (error) {
      console.log(error);
    }
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="Register register-page" style={{ zIndex: 9999 }}>
      <div className="register-container">
        <img src={logo} alt="Company Logo" className="center-image" />
        <h4>
          <i>{fromAdmin ? 'Create Clerk Account' : 'Log in Portal'}</i>
        </h4>

        <form onSubmit={onSubmit}>
          <label htmlFor="name">Full Name</label>
          <br />
          <input
            type="text"
            name="name"
            id="name"
            required
            onChange={onChange}
            value={name}
          />
          <br />

          <label htmlFor="email">Email</label>
          <br />
          <input
            type="email"
            name="email"
            id="email"
            required
            onChange={onChange}
            value={email}
          />
          <br />

          {/* ✅ Only show password fields when NOT coming from admin */}
          {!fromAdmin && (
            <>
              <label htmlFor="password">Password</label>
              <br />
              <input
                type="password"
                name="password"
                id="password"
                onChange={onChange}
                value={password}
                required
              />
              <br />

              <label htmlFor="password2">Confirm Password</label>
              <br />
              <input
                type="password"
                name="password2"
                id="password2"
                required
                onChange={onChange}
                value={password2}
              />
              <br />
            </>
          )}

          <div className="submit-btn">
            <button type="submit">
              {fromAdmin ? 'Create Clerk' : 'Register'}
            </button>
          </div>
        </form>

        {/* Only show login link for normal flow, not when admin is adding a clerk */}
        {!fromAdmin && (
          <Link to="/login">
            <button className="link-to-register">Log in to your account</button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Register;