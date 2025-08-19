import { Amplify } from 'aws-amplify';

const awsconfig = {
  Auth: {
    Cognito: {
      region: 'ap-south-1',
      userPoolId: 'ap-south-1_x76asAEFZ', // Replace with your User Pool ID
      userPoolClientId: '631msbrfpevca0h86hvoemim1j', // Replace with your App Client ID
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
