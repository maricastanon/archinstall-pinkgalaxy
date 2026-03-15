// ══ AWS AMPLIFY CONFIGURATION ══
import { Amplify } from 'aws-amplify';

const awsExports = {
  "aws_project_region": "eu-central-1",
  "aws_cognito_region": "eu-central-1",
  "aws_user_pools_id": "eu-central-1_XXXXXXXXX", // Will be auto-generated
  "aws_user_pools_web_client_id": "XXXXXXXXXXXXXXXXXXXXXXXXXX", // Will be auto-generated
  "oauth": {},
  "aws_cognito_username_attributes": ["EMAIL"],
  "aws_cognito_social_providers": [],
  "aws_cognito_signup_attributes": ["EMAIL"],
  "aws_cognito_mfa_configuration": "OFF",
  "aws_cognito_mfa_types": ["SMS"],
  "aws_cognito_password_protection_settings": {
    "passwordPolicyMinLength": 8,
    "passwordPolicyCharacters": []
  },
  "aws_cognito_verification_mechanisms": ["EMAIL"],
  "aws_appsync_graphqlEndpoint": "https://XXXXXXXXXXXXXXXXXXXXXXXX.appsync.eu-central-1.amazonaws.com/graphql", // Will be auto-generated
  "aws_appsync_region": "eu-central-1",
  "aws_appsync_authenticationType": "AMAZON_COGNITO_USER_POOLS",
  "aws_appsync_apiKey": null
};

// Configure Amplify
Amplify.configure(awsExports);

// Export for use in other modules
window.awsExports = awsExports;