// frontend/src/components/SetPasswordPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setPasswordWithToken, reset } from '../features/auth/authSlice';
import { toast } from 'react-hot-toast';
import './Login.css';

const SetPasswordPage = () => {
  const { token } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');

  useEffect(() => {
    if (isError && message) {
      toast.error(message);
      dispatch(reset());
    }

    if (isSuccess) {
      toast.success('Password set successfully! Welcome to The Residence Hall Portal.');
      dispatch(reset());
      navigate('/dashboard');
    }
  }, [isError, isSuccess, message, dispatch, navigate]);

  const onSubmit = (e) => {
    e.preventDefault();

    if (!password || password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (password !== password2) {
      toast.error('Passwords do not match');
      return;
    }

    // Send both password and password2
    dispatch(setPasswordWithToken({ token, password, password2 }));
  };

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="background-pattern" />
      </div>

      <div className="login-container">
        <div className="login-header">
          <div className="login-brand">
            <div className="brand-text">
              <h1>Residence Hall Portal</h1>
            </div>
          </div>
          <div className="login-welcome">
            <h2>Set your password</h2>
            <p>
              Welcome! Please create a secure password to complete your account setup.
              This link expires in 3 weeks.
            </p>
          </div>
        </div>

        <div className="login-form-container">
          <div className="form-header">
            <h3>Create your password</h3>
            <p>
              Your password must be at least 8 characters. Use a mix of letters,
              numbers, and symbols for better security.
            </p>
          </div>

          <form onSubmit={onSubmit}>
            <div className="form-field">
              <label className="form-label" htmlFor="password">
                <span>New password</span>
              </label>
              <div className="field-input">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={isLoading}
                  placeholder="At least 8 characters"
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="password2">
                <span>Confirm password</span>
              </label>
              <div className="field-input">
                <input
                  id="password2"
                  type="password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  autoComplete="new-password"
                  disabled={isLoading}
                  placeholder="Re-enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? 'Setting up your account...' : 'Complete Setup'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetPasswordPage;