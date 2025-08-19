const awsconfig = {
  Auth: {
    Cognito: {
      region: 'ap-south-1',
      userPoolId: 'ap-south-1_x76asAEFZ', // ✅ NO backslash
      userPoolClientId: '631msbrfpevca0h86hvoemim1j',
      signUpVerificationMethod: 'code',
      loginWith: { 
        email: true, 
        username: true 
      }
    }
  }
};

export default awsconfig;
