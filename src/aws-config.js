import { Amplify } from 'aws-amplify';

const awsconfig = {
  aws_project_region: 'ap-south-1',
  aws_cognito_region: 'ap-south-1',
  aws_user_pools_id: 'ap-south-1_x76asAEFZ',
  aws_user_pools_web_client_id: '631msbrfpevca0h86hvoemim1j', // Replace with new client ID
  aws_cognito_username_attributes: ['EMAIL'],
  aws_cognito_social_providers: [],
  aws_cognito_signup_attributes: ['EMAIL'],
  aws_cognito_mfa_configuration: 'OFF',
  aws_cognito_verification_mechanisms: ['EMAIL']
};

Amplify.configure(awsconfig);

export default awsconfig;
