import login from './login.js';

// Create alarm when extension is installed/updated
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('periodicLogin', {
    periodInMinutes: 60 // Run every hour
  });
  console.log('WiFix Login Extension installed, alarm created');
});

// Listen for alarm
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'periodicLogin') {
    const creds = await chrome.storage.local.get(['username', 'password']);
    if (!creds.username || !creds.password) {
      console.log('No credentials stored');
      return;
    }

    const success = await login(creds.username, creds.password);
    console.log(success ? 'Background login successful' : 'Background login failed');
  }
});
