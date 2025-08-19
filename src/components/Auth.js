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
        label: 'Email',
        placeholder: 'Enter your email address',
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

  return (
    <Authenticator formFields={formFields}>
      {({ signOut, user }) => (
        <div className="authenticated-app">
          <div className="auth-header">
            <div className="user-info">
              <span>Welcome, {user.attributes.name || user.attributes.email || user.username}!</span>
              <button onClick={signOut} className="sign-out-btn">
                Sign Out
              </button>
            </div>
          </div>
          {children}
        </div>
      )}
    </Authenticator>
  );
};

export default Auth;
