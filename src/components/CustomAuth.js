import React, { useState } from 'react';
import { Auth } from 'aws-amplify';
import './CustomAuth.css';

const CustomAuth = ({ onAuthSuccess, onClose }) => {
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form states
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    verificationCode: ''
  });
  
  const [showVerification, setShowVerification] = useState(false);
  const [tempUser, setTempUser] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setError('');
  };

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    
    try {
      const username = loginMethod === 'email' ? formData.email : formData.phone;
      const user = await Auth.signIn(username, formData.password);
      
      if (user.challengeName === 'SMS_MFA' || user.challengeName === 'SOFTWARE_TOKEN_MFA') {
        setShowVerification(true);
        setTempUser(user);
      } else {
        onAuthSuccess(user);
      }
    } catch (err) {
      setError(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    try {
      const signUpConfig = {
        username: formData.email, // Use email as username
        password: formData.password,
        attributes: {
          email: formData.email,
          phone_number: formData.phone.startsWith('+') ? formData.phone : `+91${formData.phone}`
        }
      };
      
      const result = await Auth.signUp(signUpConfig);
      setTempUser(result.user);
      setShowVerification(true);
    } catch (err) {
      setError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (mode === 'signup') {
        await Auth.confirmSignUp(formData.email, formData.verificationCode);
        // Auto sign in after confirmation
        const user = await Auth.signIn(formData.email, formData.password);
        onAuthSuccess(user);
      } else {
        const user = await Auth.confirmSignIn(tempUser, formData.verificationCode);
        onAuthSuccess(user);
      }
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await Auth.federatedSignIn({ provider: 'Google' });
    } catch (err) {
      setError('Google sign-in failed');
    }
  };

  if (showVerification) {
    return (
      <div className="custom-auth-modal">
        <div className="auth-container">
          <button className="close-btn" onClick={onClose}>✕</button>
          
          <div className="auth-header">
            <h2>Verify Your Account</h2>
            <p className="security-text">
              <span className="security-icon">🔒</span>
              Your information is safe with us
            </p>
          </div>

          <div className="form-group">
            <input
              type="text"
              placeholder="Enter verification code"
              value={formData.verificationCode}
              onChange={(e) => handleInputChange('verificationCode', e.target.value)}
              className="auth-input"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            className="continue-btn" 
            onClick={handleVerification}
            disabled={loading || !formData.verificationCode}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="custom-auth-modal">
      <div className="auth-container">
        <button className="close-btn" onClick={onClose}>✕</button>
        
        <div className="auth-header">
          <h2>{mode === 'signin' ? 'Login' : 'Create Account'}</h2>
          <p className="security-text">
            <span className="security-icon">🔒</span>
            Your information is safe with us
          </p>
        </div>

        {mode === 'signin' && (
          <div className="login-method-toggle">
            <button 
              className={`method-btn ${loginMethod === 'email' ? 'active' : ''}`}
              onClick={() => setLoginMethod('email')}
            >
              Email
            </button>
            <button 
              className={`method-btn ${loginMethod === 'phone' ? 'active' : ''}`}
              onClick={() => setLoginMethod('phone')}
            >
              Phone
            </button>
          </div>
        )}

        <div className="form-group">
          {(loginMethod === 'email' || mode === 'signup') && (
            <input
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="auth-input"
            />
          )}
        </div>

        {(loginMethod === 'phone' || mode === 'signup') && (
          <div className="form-group phone-group">
            <div className="phone-input-container">
              <select className="country-code">
                <option value="+91">🇮🇳 +91</option>
              </select>
              <input
                type="tel"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="auth-input phone-input"
              />
            </div>
          </div>
        )}

        <div className="form-group">
          <input
            type="password"
            placeholder="Enter password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className="auth-input"
          />
        </div>

        {mode === 'signup' && (
          <div className="form-group">
            <input
              type="password"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="auth-input"
            />
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <button 
          className="continue-btn" 
          onClick={mode === 'signin' ? handleSignIn : handleSignUp}
          disabled={loading}
        >
          {loading ? 'Please wait...' : (mode === 'signin' ? 'Continue' : 'Create Account')}
        </button>

        <div className="divider">
          <span>OR</span>
        </div>

        <button className="google-btn" onClick={handleGoogleSignIn}>
          <span className="google-icon">🅶</span>
          Continue via Google
        </button>

        <div className="auth-switch">
          <p>
            {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
            <button 
              className="switch-btn"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            >
              {mode === 'signin' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomAuth;
