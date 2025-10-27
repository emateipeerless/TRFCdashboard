
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import '@aws-amplify/ui-react/styles.css';
import './styles.css'
import './amplifyConfig.js'

import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth'; // v6 modular


console.log('✅ Amplify configured (v6)');
console.log('API ENDPOINTS: ', Amplify.getConfig().API?.REST?.endpoints);

// expose for debugging (optional)
window._amp = Amplify;

// probe: should NOT throw "UserPool not configured"
fetchAuthSession()
  .then(() => console.log('✅ fetchAuthSession OK'))
  .catch(e => console.error('❌ fetchAuthSession error', e));

ReactDOM.createRoot(document.getElementById('root')).render(<App />);