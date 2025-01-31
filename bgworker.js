async function stopAllActivities() {
  await chrome.alarms.clearAll();
  console.log('Stopped all Wifix background activities');
}

async function startAllActivities() {
  await initializeAlarm();
  await checkAndReconnect();
  console.log('Started all Wifix background activities');
}

async function checkAndReconnect() {
  try {
    const data = await chrome.storage.local.get(['isWifixing', 'username', 'password']);
    if (!data.isWifixing) return;
    
    if (data.username && data.password) {
      await login(data.username, data.password);
    }
  } catch (error) {
    console.error('Reconnection attempt failed:', error);
  }
}

async function login(uname, password, attempt = 1) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch("http://172.16.222.1:1000/login?0330598d1f22608a", {
      method: "GET",
      headers: {
        Accept: "/",
        Connection: "keep-alive",
      },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!response.ok) {
      console.log("IIIT's server down");
      return false; // Add proper return on server down
    }
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

    try {
      const postResponse = await fetch("http://172.16.222.1:1000/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: postData.toString(),
      });

      if (!postResponse.ok) {
      console.log("the server responded to r2 but not a ok")
      throw new Error(`Second fetch failed on attempt ${attempt}`);
      }
    } catch (error) {
      console.log("connected to IIIT but login failed on the second request ",error.message);
      if (attempt < 4) {
        // Use await to prevent parallel attempts
        await new Promise(resolve => setTimeout(resolve, 1000));
        return login(uname, password, attempt + 1);
      }
      return false;
    }

    const currentTime = new Date().toLocaleString();
    console.log(`Logged in at ${currentTime}`);
    return true;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log("Request timed out");
    }
    console.log("Not connected to IIIT", error.message);
    return false;
  }
}

// Handle activation with network recovery
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil((async () => {
    await self.clients.claim();
    const { isWifixing } = await chrome.storage.local.get(['isWifixing']);
    await checkAndReconnect(); // Add missing await
    if (isWifixing ?? true) { // Default to true like popup.js
      await initializeAlarm();
    }
  })());
});

// Initialize alarm with shorter interval
async function initializeAlarm() {
  await chrome.alarms.create('periodicLogin', {
    periodInMinutes: 5, // Run every 5 mins
    delayInMinutes: 0 // Start immediately
  });
  console.log("initialized Alarm")
}

// Add storage change listener
chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === 'local' && changes.isWifixing) {
    console.log('Wifix state changed:', changes.isWifixing.newValue);
    if (changes.isWifixing.newValue) {
      await startAllActivities();
    } else {
      stopAllActivities();
    }
  }
});

// Handle startup events
chrome.runtime.onStartup.addListener(async () => {
  console.log('System startup detected');
  const { isWifixing } = await chrome.storage.local.get(['isWifixing']);
  if (isWifixing) {
    await startAllActivities();
  }
});

// Handle installation events
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Extension installed or updated');
  const { isWifixing } = await chrome.storage.local.get(['isWifixing']);
  if (isWifixing) {
    await startAllActivities();
  }
});

// Listen for alarm with error handling and mutex
let isReconnecting = false;
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'periodicLogin' && !isReconnecting) {
    try {
      isReconnecting = true;
      const currentTime = new Date().toLocaleString();
      console.log(`Alarm triggered at: ${currentTime}`);
      await checkAndReconnect();
    } finally {
      isReconnecting = false;
    }
  }
});

// Handle system resume with proper async
chrome.runtime.onSuspendCanceled.addListener(() => {
  const currentTime = new Date().toLocaleString();
  console.log(`Chrome tried to suspend wifix at ${currentTime}`);
  (async () => {
    await checkAndReconnect();
  })();
});

// Make connection change handler async
async function onConnectionChange() {
  const currentTime = new Date().toLocaleString();
  console.log(`wifi changed at: ${currentTime}`);
  // await startAllActivities();
  await checkAndReconnect();
}

navigator.connection.addEventListener("change", onConnectionChange);

