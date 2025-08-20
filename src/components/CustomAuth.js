import React, { useState } from 'react';
import { Auth } from 'aws-amplify';
import './CustomAuth.css';

const CustomAuth = ({ onAuthSuccess, onClose }) => {
  const [mode, setMode] = useState('signin');
  const [loginMethod, setLoginMethod] = useState('email'); // For both signin and signup
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
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
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10 ? `+91${cleaned}` : `+91${cleaned}`;
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError('');
    
    // Validation based on selected method
    if (loginMethod === 'email') {
      if (!formData.email || !formData.password) {
        setError('Email and password are required');
        setLoading(false);
        return;
      }
    } else {
      if (!formData.phone || !formData.password) {
        setError('Phone number and password are required');
        setLoading(false);
        return;
      }
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }
    
    try {
      let signUpConfig;
      
      if (loginMethod === 'email') {
        // Email signup
        signUpConfig = {
          username: formData.email,
          password: formData.password,
          attributes: {
            email: formData.email
          }
        };
      } else {
        // Phone signup  
        const phoneNumber = formatPhoneNumber(formData.phone);
        signUpConfig = {
          username: phoneNumber,
          password: formData.password,
          attributes: {
            phone_number: phoneNumber
          }
        };
      }
      
      console.log('Signup attempt:', { 
        method: loginMethod,
        username: signUpConfig.username 
      });
      
      const result = await Auth.signUp(signUpConfig);
      console.log('SignUp success:', result);
      
      setShowVerification(true);
      
    } catch (err) {
      console.error('SignUp error:', err);
      
      let errorMessage = 'Account creation failed. ';
      
      if (err.code === 'UsernameExistsException') {
        errorMessage = `An account with this ${loginMethod} already exists. Try signing in instead.`;
      } else if (err.code === 'InvalidPasswordException') {
        errorMessage = 'Password must be at least 6 characters with mixed case and numbers.';
      } else if (err.code === 'InvalidParameterException') {
        errorMessage = `Please enter a valid ${loginMethod === 'email' ? 'email address' : 'phone number'}.`;
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
      let username = loginMethod === 'email' ? formData.email : formatPhoneNumber(formData.phone);
      const user = await Auth.signIn(username, formData.password);
      onAuthSuccess(user);
      
    } catch (err) {
      console.error('SignIn error:', err);
      
      let errorMessage = 'Sign in failed. ';
      
      if (err.code === 'UserNotConfirmedException') {
        errorMessage = 'Please verify your account first. Check your email/SMS for verification code.';
      } else if (err.code === 'NotAuthorizedException') {
        errorMessage = `Incorrect ${loginMethod} or password. Please try again.`;
      } else if (err.code === 'UserNotFoundException') {
        errorMessage = `No account found with this ${loginMethod}. Please sign up first.`;
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
      const username = loginMethod === 'email' ? formData.email : formatPhoneNumber(formData.phone);
      await Auth.confirmSignUp(username, formData.verificationCode);
      
      // Auto sign in after confirmation
      const user = await Auth.signIn(username, formData.password);
      onAuthSuccess(user);
      
    } catch (err) {
      console.error('Verification error:', err);
      
      let errorMessage = 'Verification failed. ';
      
      if (err.code === 'CodeMismatchException') {
        errorMessage = 'Invalid verification code. Please check and try again.';
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
              Check your {loginMethod === 'email' ? 'email' : 'SMS'} for verification code
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
                const username = loginMethod === 'email' ? formData.email : formatPhoneNumber(formData.phone);
                await Auth.resendSignUp(username);
                setError(`New verification code sent to your ${loginMethod}!`);
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

        {/* Method toggle for BOTH signin and signup */}
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

        <div className="form-group">
          {loginMethod === 'email' ? (
            <input
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value.toLowerCase().trim())}
              className="auth-input"
            />
          ) : (
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
          )}
        </div>

        <div className="form-group">
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password (min 6 characters)"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="auth-input password-input"
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        {mode === 'signup' && (
          <div className="form-group">
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="auth-input password-input"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
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
                setFormData({
                  email: '',
                  phone: '',
                  password: '',
                  confirmPassword: '',
                  verificationCode: ''
                });
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
