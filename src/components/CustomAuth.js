import React, { useState } from 'react';
import { Auth } from 'aws-amplify';
import './CustomAuth.css';

const CustomAuth = ({ onAuthSuccess, onClose }) => {
  const [mode, setMode] = useState('signin');
  const [loginMethod, setLoginMethod] = useState('email');
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

  const handleSignUp = async () => {
    setLoading(true);
    setError('');
    
    // Basic validation
    if (loginMethod === 'email' && (!formData.email || !formData.password)) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }
    
    if (loginMethod === 'phone' && (!formData.phone || !formData.password)) {
      setError('Phone and password are required');
      setLoading(false);
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    try {
      let signUpConfig;
      
      if (loginMethod === 'email') {
        // Email signup - use email as username (Cognito requirement)
        signUpConfig = {
          username: formData.email,  // This is the key fix
          password: formData.password,
          attributes: {
            email: formData.email
          }
        };
      } else {
        // Phone signup
        const phoneNumber = formData.phone.startsWith('+91') 
          ? formData.phone 
          : `+91${formData.phone}`;
          
        signUpConfig = {
          username: phoneNumber,  // Use phone as username
          password: formData.password,
          attributes: {
            phone_number: phoneNumber
          }
        };
      }
      
      console.log('SignUp Config:', {
        username: signUpConfig.username,
        attributes: signUpConfig.attributes
      });
      
      const result = await Auth.signUp(signUpConfig);
      console.log('SignUp Success:', result);
      
      // Store the username for verification
      setFormData({...formData, username: signUpConfig.username});
      setShowVerification(true);
      
    } catch (err) {
      console.error('SignUp Error Full Details:', err);
      
      let errorMessage = 'Account creation failed. ';
      
      switch (err.code) {
        case 'UsernameExistsException':
          errorMessage = `An account with this ${loginMethod} already exists. Try signing in instead.`;
          break;
        case 'InvalidParameterException':
          errorMessage = `Please check your ${loginMethod === 'email' ? 'email format' : 'phone number format'}.`;
          break;
        case 'InvalidPasswordException':
          errorMessage = 'Password must be at least 8 characters with uppercase, lowercase, numbers and special characters.';
          break;
        case 'CodeMismatchException':
          errorMessage = 'Invalid verification code.';
          break;
        default:
          errorMessage = err.message || 'Please try again with a different email/phone.';
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
      let username = loginMethod === 'email' 
        ? formData.email 
        : (formData.phone.startsWith('+91') ? formData.phone : `+91${formData.phone}`);
        
      const user = await Auth.signIn(username, formData.password);
      onAuthSuccess(user);
      
    } catch (err) {
      console.error('SignIn Error:', err);
      
      let errorMessage = 'Sign in failed. ';
      
      switch (err.code) {
        case 'UserNotConfirmedException':
          errorMessage = `Please verify your ${loginMethod} first. Check for verification code.`;
          break;
        case 'NotAuthorizedException':
          errorMessage = `Incorrect ${loginMethod} or password.`;
          break;
        case 'UserNotFoundException':
          errorMessage = `No account found with this ${loginMethod}.`;
          break;
        default:
          errorMessage = err.message || 'Please check your credentials.';
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
      const username = formData.username || 
        (loginMethod === 'email' ? formData.email : `+91${formData.phone}`);
        
      await Auth.confirmSignUp(username, formData.verificationCode);
      
      // Auto sign in after confirmation
      const user = await Auth.signIn(username, formData.password);
      onAuthSuccess(user);
      
    } catch (err) {
      console.error('Verification Error:', err);
      
      let errorMessage = 'Verification failed. ';
      
      switch (err.code) {
        case 'CodeMismatchException':
          errorMessage = 'Invalid verification code. Please try again.';
          break;
        case 'ExpiredCodeException':
          errorMessage = 'Code expired. Please request a new one.';
          break;
        default:
          errorMessage = err.message || 'Please check your verification code.';
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
                const username = formData.username || 
                  (loginMethod === 'email' ? formData.email : `+91${formData.phone}`);
                await Auth.resendSignUp(username);
                setError(`New code sent to your ${loginMethod}!`);
              } catch (err) {
                setError('Failed to resend. Please try again.');
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
                placeholder="10-digit mobile number"
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
              placeholder="Enter password (min 8 characters)"
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
