let isServiceWorkerActive = false;

// Keep service worker alive
function keepAlive() {
  const keepAliveInterval = 20000; // 20 seconds
  setInterval(() => {
    if (isServiceWorkerActive) {
      console.log('Bg active');
      checkAndReconnect();
    }
  }, keepAliveInterval);
}

async function checkAndReconnect() {
  try {
    const { isWifixing } = await chrome.storage.local.get(['isWifixing']);
    if (isWifixing ?? true) {
      const creds = await chrome.storage.local.get(['username', 'password']);
      if (creds.username && creds.password) {
        await login(creds.username, creds.password);
      }
    }
  } catch (error) {
    console.error('Reconnection attempt failed:', error);
  }
}

async function login(uname, password) {
  try {
    console.log("Starting login process...");
    const response = await fetch("http://172.16.222.1:1000/login?0330598d1f22608a", {
      method: "GET",
      headers: {
        Accept: "/",
        Connection: "keep-alive",
      },
    });
    const html = await response.text();
    
    const redirectRegex = /4Tredir" value="([^"]+)"/;
    const magicRegex = /magic" value="([^"]+)"/;
    
    const redirect = html.match(redirectRegex)?.[1];
    const magic = html.match(magicRegex)?.[1];

    const postData = new URLSearchParams({
      "4Tredir": redirect,
      magic: magic,
      username: uname,
      password: password,
    });

    await fetch("http://172.16.222.1:1000/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: postData.toString(),
    });

    console.log("Logged in successfully.");
    return true;
  } catch (error) {
    console.error("Error during login:", error.message);
    return false;
  }
}

// Handle installation
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  self.skipWaiting();
  isServiceWorkerActive = true;
  keepAlive();
});

// Handle activation with network recovery
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil((async () => {
    await self.clients.claim();
    await initializeAlarm();
    isServiceWorkerActive = true;
  })());
});

// Initialize alarm with shorter interval
async function initializeAlarm() {
  await chrome.alarms.create('periodicLogin', {
    periodInMinutes: 0.5, // Run every 30 seconds
    delayInMinutes: 0 // Start immediately
  });
  await chrome.storage.local.set({ isWifixing: true });
}

// Handle startup events
chrome.runtime.onStartup.addListener(async () => {
  console.log('System startup detected');
  isServiceWorkerActive = true;
  await initializeAlarm();
  await checkAndReconnect();
});

// Listen for alarm with error handling
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'periodicLogin') {
    await checkAndReconnect();
  }
});

// Handle system resume
chrome.runtime.onSuspendCanceled.addListener(() => {
  console.log('System resume detected');
  isServiceWorkerActive = true;
  checkAndReconnect();
});
