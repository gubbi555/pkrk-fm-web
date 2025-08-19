import { Amplify } from 'aws-amplify';

const awsconfig = {
  Auth: {
    Cognito: {
      region: 'ap-south-1',
      userPoolId: 'ap-south-1_x76asAEFZ', // ✅ Fixed: removed backslash
      userPoolClientId: '631msbrfpevca0h86hvoemim1j', // ✅ Correct
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
