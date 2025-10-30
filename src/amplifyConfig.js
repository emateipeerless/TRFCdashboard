import { Amplify } from 'aws-amplify';

const REGION = 'us-east-1';
const API_NAME = 'TRFCapi';

const config = {
  Auth: {
    Cognito: {
      region: 'us-east-1',
      userPoolId: 'us-east-1_2uXPhvPJE', 
      userPoolClientId: 'fsv0c9tmbhjcm9ct3oj0vodb4', 
      identityPoolId: 'us-east-1:595d4705-d6d4-4120-b536-36f26787801e',
      loginWith: { email: true, username: false, phone: false }
    }
  },
  API: {
    REST: {
      endpoints: [
        { name: 'TRFCapi',
          endpoint: 'https://lyle5fozf7.execute-api.us-east-1.amazonaws.com',
          region: 'us-east-1'}
      ]
    }
  }
};

// Guard so accidental double-imports don’t wipe config
const already = Amplify.getConfig()?.Auth?.Cognito;
if (!already) {
  Amplify.configure(config);
  
}

export { Amplify, API_NAME };