import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { login, reset } from '../features/auth/authSlice';
import './Login.css';

// ============================================================================
// Icons
// ============================================================================
const Icons = {
  Lock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  User: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  AlertCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  LogIn: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  ),
  Loader: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  ),
  ArrowRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
};

// ============================================================================
// Loading Spinner Component
// ============================================================================
const LoadingSpinner = () => (
  <div className="spinner">
    <Icons.Loader />
  </div>
);

// ============================================================================
// Form Field Component
// ============================================================================
const FormField = ({ icon: Icon, label, type = 'text', name, value, onChange, error, placeholder, disabled }) => (
  <div className={`form-field ${error ? 'error' : ''}`}>
    <label htmlFor={name} className="form-label">
      <div className="label-icon">
        <Icon />
      </div>
      <span>{label}</span>
    </label>
    <div className="field-input">
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={type === 'password' ? 'current-password' : 'username'}
        className={error ? 'error' : ''}
      />
    </div>
    {error && (
      <div className="field-error">
        <Icons.AlertCircle />
        {error}
      </div>
    )}
  </div>
);

// ============================================================================
// Main Login Component
// ============================================================================
const Login = () => {
  const [formData, setFormData] = useState({ clerkCred: '', password: '' });
  const { clerkCred, password } = formData;
  const [fieldErrors, setFieldErrors] = useState({ clerkCred: '', password: '' });

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { clerk, isLoading, isError, isSuccess, message } = useSelector(state => state.auth);

  useEffect(() => {
    if (isError) {
      toast.error(message, {
        style: {
          border: '2px solid #841617',
          padding: '16px',
          color: '#000000',
        },
      });
      // Set field errors based on message
      if (message.toLowerCase().includes('user')) {
        setFieldErrors(prev => ({ ...prev, clerkCred: 'Invalid user ID' }));
      } else if (message.toLowerCase().includes('password')) {
        setFieldErrors(prev => ({ ...prev, password: 'Invalid password' }));
      }
    }
    if (isSuccess || clerk) {
      navigate('/');
    }
    dispatch(reset());
  }, [clerk, isError, isSuccess, message, navigate, dispatch]);

  const onChange = e => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!clerkCred.trim()) errors.clerkCred = 'User ID is required';
    if (!password) errors.password = 'Password is required';
    return errors;
  };

  const onSubmit = e => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    const clerkData = { clerkCred, password };
    dispatch(login(clerkData));
  };

  // Show full-screen loading state
  if (isLoading) {
    return (
      <div className="login-loading">
        <div className="login-spinner-container">
          <LoadingSpinner />
          <p>Signing you in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      {/* Background pattern */}
      <div className="login-background">
        <div className="background-pattern"></div>
      </div>

      {/* Main container */}
      <div className="login-container">
        {/* Header Section */}
        <div className="login-header">
            <div className="brand-text">
              <h1>Hall Hosting</h1>
          </div>
          <div className="login-welcome">
            <h2>Welcome Back</h2>
            <p>Sign in to manage guest visits</p>
          </div>
        </div>

        {/* Form Section */}
        <div className="login-form-container">
          <form onSubmit={onSubmit} className="login-form">

            <FormField
              icon={Icons.User}
              label="User ID"
              type="text"
              name="clerkCred"
              value={clerkCred}
              onChange={onChange}
              error={fieldErrors.clerkCred}
              placeholder="Enter your user ID"
              disabled={isLoading}
            />

            <FormField
              icon={Icons.Lock}
              label="Password"
              type="password"
              name="password"
              value={password}
              onChange={onChange}
              error={fieldErrors.password}
              placeholder="Enter your password"
              disabled={isLoading}
            />

            {/* Forgot Links */}
            <div className="forgot-links">
              <button type="button" className="forgot-link">
                Forgot User ID?
              </button>
              <button type="button" className="forgot-link">
                Forgot Password?
              </button>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="login-button"
              disabled={isLoading || !clerkCred || !password}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  Signing In...
                </>
              ) : (
                <>
                  <Icons.LogIn />
                  Sign In
                </>
              )}
            </button>

            {/* Divider */}
            <div className="form-divider">
              <span>New to Hall Hosting?</span>
            </div>

            {/* Register Link */}
            <Link to="/register" className="register-link">
              <button type="button" className="register-button">
                Create an account
                <Icons.ArrowRight />
              </button>
            </Link>
          </form>

          <p className="footer-text">
            Need help? Contact the system administrator.
          </p>
          <div className="footer-links">
            <a href="#" className="footer-link">Privacy Policy</a>
            <span className="footer-separator">•</span>
            <a href="#" className="footer-link">Terms of Service</a>
          </div>
        </div>

        {/* Footer */}

      </div>
    </div>
  );
};

export default Login;