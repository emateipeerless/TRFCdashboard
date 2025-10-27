import { Amplify } from 'aws-amplify';

// ---- EDIT THESE 4 VALUES ----
const REGION = 'us-east-1';
const API_NAME = 'TRFCapi'; // <- exactly what your log showed

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
  // Optional debug:
  // console.log('amplifyConfig: configured', Amplify.getConfig().API?.REST?.endpoints);
}

export { Amplify, API_NAME };