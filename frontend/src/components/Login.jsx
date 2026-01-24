// frontend/src/components/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { login, reset } from '../features/auth/authSlice';
import './Login.css';

// ============================================================================
// Icons (lucide-react)
// ============================================================================
import {
  Lock,
  User,
  AlertCircle,
  LogIn,
  Loader2,
  ArrowRight,
} from 'lucide-react';

const Icons = {
  Lock,
  User,
  AlertCircle,
  LogIn,
  Loader: Loader2,
  ArrowRight,
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
const FormField = ({
  icon: Icon,
  label,
  type = 'text',
  name,
  value,
  onChange,
  error,
  placeholder,
  disabled,
}) => (
  <div className={`form-field ${error ? 'error' : ''}`}>
    <label htmlFor={name} className="form-label">
      <div className="label-icon">
        <Icon size={18} />
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
        <Icons.AlertCircle size={16} />
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
  const [fieldErrors, setFieldErrors] = useState({
    clerkCred: '',
    password: '',
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { clerk, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (isError) {
      toast.error(message || 'Login failed', {
        style: {
          border: '2px solid #841617',
          padding: '16px',
          color: '#000000',
        },
      });

      const lowerMsg = (message || '').toLowerCase();

      // Set field errors based on message
      if (lowerMsg.includes('user')) {
        setFieldErrors((prev) => ({
          ...prev,
          clerkCred: 'Invalid user ID',
        }));
      } else if (lowerMsg.includes('password')) {
        setFieldErrors((prev) => ({
          ...prev,
          password: 'Invalid password',
        }));
      }
    }

    if (isSuccess || clerk) {
      navigate('/');
    }

    dispatch(reset());
  }, [clerk, isError, isSuccess, message, navigate, dispatch]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!clerkCred.trim()) errors.clerkCred = 'User ID is required';
    if (!password) errors.password = 'Password is required';
    return errors;
  };

  const onSubmit = (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const clerkData = { clerkCred, password };
    dispatch(login(clerkData));
  };

  // Full-screen loading state
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
            <h1>Headington Hall Portal</h1>
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
                  <Icons.LogIn size={18} />
                  Sign In
                </>
              )}
            </button>

            {/* Footer inside form to maintain proper spacing */}
            <div className="form-footer">
              <p className="footer-text">
                Need help? Contact the system administrator.
              </p>
              <div className="footer-links">
                <a href="#" className="footer-link">
                  Privacy Policy
                </a>
                <span className="footer-separator">•</span>
                <a href="#" className="footer-link">
                  Terms of Service
                </a>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
