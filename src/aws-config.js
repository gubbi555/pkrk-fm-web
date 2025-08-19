import { Amplify } from 'aws-amplify';

const awsconfig = {
  aws_project_region: 'ap-south-1',
  aws_cognito_region: 'ap-south-1',
  aws_user_pools_id: 'ap-south-1_WRVFROpLe', // From new pool
  aws_user_pools_web_client_id: '3692ev97rvvvek80it6olvdo5f', // From new SPA client
  aws_cognito_username_attributes: ['EMAIL'],
  aws_cognito_social_providers: [],
  aws_cognito_signup_attributes: ['EMAIL'],
  aws_cognito_mfa_configuration: 'OFF',
  aws_cognito_verification_mechanisms: ['EMAIL']
};

Amplify.configure(awsconfig);

export default awsconfig;
