import React from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

const Auth = ({ children }) => {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div className="authenticated-app">
          <div className="auth-header">
            <div className="user-info">
              <span>Welcome, {user.attributes.name || user.username}!</span>
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
