import React from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

const Auth = ({ children }) => {
  const formFields = {
    signIn: {
      username: {
        label: 'Email or Username',
        placeholder: 'Enter your email or username',
      },
    },
    signUp: {
      username: {
        label: 'Username',
        placeholder: 'Enter your username',
      },
      email: {
        label: 'Email',
        placeholder: 'Enter your email',
      },
      password: {
        label: 'Password',
        placeholder: 'Enter your password',
      },
      confirm_password: {
        label: 'Confirm Password',
        placeholder: 'Confirm your password',
      },
    },
  };

  const components = {
    Header() {
      return (
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <h2 style={{ color: '#667eea', fontSize: '1.8rem', fontWeight: '800' }}>
            🎵 Welcome to PKRK FM
          </h2>
          <p style={{ color: '#666', fontSize: '1rem' }}>
            Your Gateway to Premium Kannada Audio Content
          </p>
        </div>
      );
    },
  };

  return (
    <Authenticator
      formFields={formFields}
      components={components}
      variation="modal"
      hideSignUp={false}
    >
      {children}
    </Authenticator>
  );
};

export default Auth;
