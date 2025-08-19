import { Amplify } from 'aws-amplify';

const awsconfig = {
  Auth: {
    Cognito: {
      region: 'ap-south-1',
      userPoolId: 'ap-south-1_XXXXXXXXX', // Replace with your User Pool ID
      userPoolClientId: 'abcd1234efgh5678ijkl', // Replace with your App Client ID
      signUpVerificationMethod: 'code',
      loginWith: {
        email: true,
        username: true
      }
    }
  }
};

Amplify.configure(awsconfig);

export default awsconfig;
