import React from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Auth } from 'aws-amplify';
// Or for newer versions:
import { getCurrentUser } from 'aws-amplify/auth/cognito';


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
              <span>Welcome, {user?.attributes?.email || user?.username}!</span>
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
