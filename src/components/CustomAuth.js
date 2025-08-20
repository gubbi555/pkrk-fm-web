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

  const formatPhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10 ? `+91${cleaned}` : `+91${cleaned}`;
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Enhanced logging for debugging
      console.log('🔧 DEBUG: Starting SignUp Process');
      console.log('🔧 Current Amplify Config Check');
      console.log('📝 Form Data (Safe):', {
        email: formData.email,
        emailValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
        phone: formData.phone,
        phoneValid: /^[6-9]\d{9}$/.test(formData.phone),
        passwordLength: formData.password.length,
        confirmPasswordMatch: formData.password === formData.confirmPassword,
        loginMethod: loginMethod
      });

      let signUpConfig;
      
      if (loginMethod === 'email') {
        // Email validation
        if (!formData.email || !formData.password) {
          throw new Error('Email and password are required');
        }
        
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          throw new Error('Please enter a valid email address');
        }
        
        signUpConfig = {
          username: formData.email,
          password: formData.password,
          attributes: {
            email: formData.email
          }
        };
      } else {
        // Phone validation
        if (!formData.phone || !formData.password) {
          throw new Error('Phone number and password are required');
        }
        
        if (!/^[6-9]\d{9}$/.test(formData.phone)) {
          throw new Error('Please enter a valid 10-digit mobile number');
        }
        
        const phoneNumber = formatPhoneNumber(formData.phone);
        signUpConfig = {
          username: phoneNumber,
          password: formData.password,
          attributes: {
            phone_number: phoneNumber
          }
        };
      }
      
      // Password confirmation check
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      // Password strength check (basic)
      if (formData.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      
      console.log('🚀 SignUp Config:', {
        username: signUpConfig.username,
        attributesKeys: Object.keys(signUpConfig.attributes),
        passwordLength: signUpConfig.password.length
      });
      
      console.log('📡 Calling Auth.signUp...');
      const result = await Auth.signUp(signUpConfig);
      
      console.log('✅ SignUp SUCCESS:', {
        userSub: result.userSub,
        codeDeliveryDetails: result.codeDeliveryDetails
      });
      
      setShowVerification(true);
      setError('');
      
    } catch (err) {
      // Comprehensive error logging
      console.error('❌ SignUp ERROR - Complete Details:');
      console.error('Error Name:', err.name);
      console.error('Error Code:', err.code);
      console.error('Error Message:', err.message);
      console.error('Full Error Object:', err);
      console.error('Error Stack:', err.stack);
      
      // More specific error handling based on error codes
      let errorMessage = 'Account creation failed. ';
      
      switch (err.code) {
        case 'InvalidPasswordException':
          errorMessage = `Password requirements not met: ${err.message}`;
          break;
        case 'UsernameExistsException':
          errorMessage = `This ${loginMethod} is already registered. Try signing in instead.`;
          break;
        case 'InvalidParameterException':
          errorMessage = `Invalid input: ${err.message}`;
          break;
        case 'NotAuthorizedException':
          errorMessage = 'Not authorized. Please check your configuration.';
          break;
        case 'LimitExceededException':
          errorMessage = 'Too many attempts. Please try again later.';
          break;
        case 'TooManyRequestsException':
          errorMessage = 'Too many requests. Please wait and try again.';
          break;
        case 'UserLambdaValidationException':
          errorMessage = 'Validation failed. Please check your input.';
          break;
        default:
          errorMessage = err.message || `Unknown error occurred (${err.code})`;
      }
      
      setError(errorMessage);
      
      // Additional debugging info
      console.error('🔍 Debug Info:');
      console.error('- User Pool ID configured?', process.env.REACT_APP_USER_POOL_ID || 'Check aws-config.js');
      console.error('- Client ID configured?', process.env.REACT_APP_USER_POOL_CLIENT_ID || 'Check aws-config.js');
      console.error('- Network connection?', navigator.onLine ? 'Online' : 'Offline');
      
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('🔧 Starting SignIn Process');
      
      const username = loginMethod === 'email' 
        ? formData.email 
        : formatPhoneNumber(formData.phone);
      
      console.log('📡 Attempting SignIn with username:', username);
        
      const user = await Auth.signIn(username, formData.password);
      
      console.log('✅ SignIn SUCCESS:', {
        username: user.username,
        attributes: user.attributes
      });
      
      onAuthSuccess(user);
      
    } catch (err) {
      console.error('❌ SignIn ERROR:', {
        code: err.code,
        message: err.message,
        name: err.name
      });
      
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
        case 'InvalidParameterException':
          errorMessage = 'Invalid login credentials format.';
          break;
        default:
          errorMessage = err.message || 'Sign in failed. Please try again.';
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
      const username = loginMethod === 'email' 
        ? formData.email 
        : formatPhoneNumber(formData.phone);
      
      console.log('📡 Confirming SignUp for:', username);
        
      await Auth.confirmSignUp(username, formData.verificationCode);
      console.log('✅ Email/SMS Verification SUCCESS');
      
      // Auto sign in after confirmation
      const user = await Auth.signIn(username, formData.password);
      console.log('✅ Auto SignIn SUCCESS');
      
      onAuthSuccess(user);
      
    } catch (err) {
      console.error('❌ Verification ERROR:', {
        code: err.code,
        message: err.message
      });
      
      let errorMessage = 'Verification failed. ';
      
      switch (err.code) {
        case 'CodeMismatchException':
          errorMessage = 'Invalid verification code. Please try again.';
          break;
        case 'ExpiredCodeException':
          errorMessage = 'Verification code expired. Please request a new one.';
          break;
        case 'LimitExceededException':
          errorMessage = 'Too many attempts. Please try again later.';
          break;
        default:
          errorMessage = err.message || 'Verification failed. Please check your code.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
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
                const username = loginMethod === 'email' 
                  ? formData.email 
                  : formatPhoneNumber(formData.phone);
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
