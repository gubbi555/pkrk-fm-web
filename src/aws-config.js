import { Amplify } from 'aws-amplify';

const awsconfig = {
  Auth: {
    Cognito: {
      region: 'ap-south-1',
      userPoolId: 'ap-south-1_x76asAEFZ',
      userPoolClientId: '631msbrfpevca0h86hvoemim1j',
      signUpVerificationMethod: 'code',
      loginWith: {
        email: true,
        username: true
      }
    }
  }
};

// Configure Amplify
Amplify.configure(awsconfig);

export default awsconfig;
