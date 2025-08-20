import React, { useState } from 'react';
import { Auth } from 'aws-amplify';
import './CustomAuth.css';

const CustomAuth = ({ onAuthSuccess, onClose }) => {
  const [mode, setMode] = useState('signin');
  const [loginMethod, setLoginMethod] = useState('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    verificationCode: ''
  });
  
  const [showVerification, setShowVerification] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setError('');
  };

  const formatPhoneNumber = (phone) => {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Add +91 prefix if not present
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+${cleaned}`;
    } else if (cleaned.length === 13 && cleaned.startsWith('+91')) {
      return cleaned;
    }
    
    return `+91${cleaned}`;
  };

  const validateForm = () => {
    if (mode === 'signup') {
      if (!formData.email || !formData.password) {
        setError('Email and password are required');
        return false;
      }
      
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters long');
        return false;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        return false;
      }
      
      // Validate phone if provided
      if (formData.phone) {
        const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile number format
        const cleanPhone = formData.phone.replace(/\D/g, '');
        if (!phoneRegex.test(cleanPhone) && cleanPhone.length !== 10) {
          setError('Please enter a valid 10-digit mobile number');
          return false;
        }
      }
    }
    
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const signUpConfig = {
        username: formData.email,
        password: formData.password,
        attributes: {
          email: formData.email
        }
      };
      
      // Add phone number if provided
      if (formData.phone && formData.phone.trim()) {
        signUpConfig.attributes.phone_number = formatPhoneNumber(formData.phone);
      }
      
      console.log('Signing up with:', signUpConfig); // Debug log
      
      const result = await Auth.signUp(signUpConfig);
      console.log('SignUp result:', result); // Debug log
      
      setShowVerification(true);
      setError(''); // Clear any previous errors
      
    } catch (err) {
      console.error('SignUp error:', err); // Debug log
      
      // Handle specific error types
      let errorMessage = 'Sign up failed. Please try again.';
      
      if (err.code === 'UsernameExistsException') {
        errorMessage = 'An account with this email already exists. Try signing in instead.';
      } else if (err.code === 'InvalidPasswordException') {
        errorMessage = 'Password must be at least 8 characters with uppercase, lowercase, and numbers.';
      } else if (err.code === 'InvalidParameterException') {
        errorMessage = 'Please check your email format and phone number.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    
    try {
      let username = loginMethod === 'email' ? formData.email : formData.phone;
      
      // Format phone number for sign in
      if (loginMethod === 'phone') {
        username = formatPhoneNumber(formData.phone);
      }
      
      const user = await Auth.signIn(username, formData.password);
      onAuthSuccess(user);
      
    } catch (err) {
      console.error('SignIn error:', err);
      
      let errorMessage = 'Sign in failed. Please check your credentials.';
      
      if (err.code === 'UserNotConfirmedException') {
        errorMessage = 'Please check your email and confirm your account first.';
      } else if (err.code === 'NotAuthorizedException') {
        errorMessage = 'Incorrect email/phone or password.';
      } else if (err.code === 'UserNotFoundException') {
        errorMessage = 'No account found with these credentials.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async () => {
    setLoading(true);
    setError('');
    
    try {
      await Auth.confirmSignUp(formData.email, formData.verificationCode);
      
      // Auto sign in after confirmation
      const user = await Auth.signIn(formData.email, formData.password);
      onAuthSuccess(user);
      
    } catch (err) {
      console.error('Verification error:', err);
      
      let errorMessage = 'Verification failed. Please check your code.';
      
      if (err.code === 'CodeMismatchException') {
        errorMessage = 'Invalid verification code. Please try again.';
      } else if (err.code === 'ExpiredCodeException') {
        errorMessage = 'Verification code expired. Please request a new one.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Verification screen
  if (showVerification) {
    return (
      <div className="custom-auth-modal">
        <div className="auth-container">
          <button className="close-btn" onClick={onClose}>✕</button>
          
          <div className="auth-header">
            <h2>Verify Your Account</h2>
            <p className="security-text">
              <span className="security-icon">🔒</span>
              Check your email for verification code
            </p>
          </div>

          <div className="form-group">
            <input
              type="text"
              placeholder="Enter 6-digit verification code"
              value={formData.verificationCode}
              onChange={(e) => handleInputChange('verificationCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="auth-input"
              maxLength="6"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            className="continue-btn" 
            onClick={handleVerification}
            disabled={loading || formData.verificationCode.length !== 6}
          >
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>
          
          <button 
            className="resend-btn"
            onClick={async () => {
              try {
                await Auth.resendSignUp(formData.email);
                setError('Verification code sent! Check your email.');
              } catch (err) {
                setError('Failed to resend code. Please try again.');
              }
            }}
          >
            Resend Code
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
              onChange={(e) => handleInputChange('email', e.target.value.toLowerCase().trim())}
              className="auth-input"
            />
          )}
        </div>

        {(loginMethod === 'phone' && mode === 'signin') && (
          <div className="form-group phone-group">
            <div className="phone-input-container">
              <select className="country-code" disabled>
                <option value="+91">🇮🇳 +91</option>
              </select>
              <input
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="auth-input phone-input"
                maxLength="10"
              />
            </div>
          </div>
        )}

        {mode === 'signup' && (
          <div className="form-group phone-group">
            <div className="phone-input-container">
              <select className="country-code" disabled>
                <option value="+91">🇮🇳 +91</option>
              </select>
              <input
                type="tel"
                placeholder="Mobile number (optional)"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="auth-input phone-input"
                maxLength="10"
              />
            </div>
          </div>
        )}

        <div className="form-group">
          <input
            type="password"
            placeholder="Enter password (min 8 characters)"
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

        <button className="google-btn" onClick={() => setError('Google sign-in coming soon!')}>
          <span className="google-icon">🅶</span>
          Continue via Google
        </button>

        <div className="auth-switch">
          <p>
            {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
            <button 
              className="switch-btn"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError('');
              }}
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
