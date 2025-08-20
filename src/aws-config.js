import { Amplify } from 'aws-amplify';

const awsconfig = {
  Auth: {
    region: 'ap-south-1',
    userPoolId: 'ap-south-1_kajtyBPTH',
    userPoolWebClientId: '11bsmqndbd8dj7k58hs7u6at2a',
    mandatorySignIn: false,
    authenticationFlowType: 'USER_SRP_AUTH'
  }
};

Amplify.configure(awsconfig);

export default awsconfig;
