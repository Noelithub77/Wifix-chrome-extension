let keepAliveIntervalId;

function keepAlive() {
  const keepAliveInterval = 20000;
  console.log("keep alive activated") //20 seconds
  keepAliveIntervalId = setInterval(async () => {
    const { isWifixing } = await chrome.storage.local.get(['isWifixing']);
    const currentTime = new Date().toLocaleString();
    console.log(`Keep alive of bg worker at ${currentTime}`);
    if (isWifixing) {
      // console.log('Wifixing');
    }
  }, keepAliveInterval);
}

function stopKeepAlive() {
  if (keepAliveIntervalId) {
    clearInterval(keepAliveIntervalId);
    console.log('Stopped keep alive interval');
  }
}

function stopAllActivities() {
  stopKeepAlive()
  chrome.alarms.clearAll();
  console.log('Stopped all Wifix background activities');
}

async function startAllActivities() {
  keepAlive()
  await initializeAlarm();
  await checkAndReconnect();
  console.log('Started all Wifix background activities');
}

async function checkAndReconnect() {
  try {
    const { isWifixing } = await chrome.storage.local.get(['isWifixing']);
    if (!isWifixing) {
      return; // Exit early if Wifix is disabled
    }
    const creds = await chrome.storage.local.get(['username', 'password']);
    if (creds.username && creds.password) {
      await login(creds.username, creds.password);
    }
  } catch (error) {
    console.error('Reconnection attempt failed:', error);
  }
}

async function login(uname, password) {
  try {
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
    const currentTime = new Date().toLocaleString();
    console.log(`Logged in at ${currentTime}`);
    return true;
  } catch (error) {
    console.error("Error during login:", error.message);
    return false;
  }
}

// Handle activation with network recovery
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  keepAlive(); // Single call to keepAlive here
  event.waitUntil((async () => {
    await self.clients.claim();
    const { isWifixing } = await chrome.storage.local.get(['isWifixing']);
    if (isWifixing ?? true) { // Default to true like popup.js
      await initializeAlarm();
    }
  })());
});

// Initialize alarm with shorter interval
async function initializeAlarm() {
  await chrome.alarms.create('periodicLogin', {
    periodInMinutes: 0.5, // Run every hour
    delayInMinutes: 0 // Start immediately
  });
  console.log("initialized Alarm")
  // await chrome.storage.local.set({ isWifixing: true }); 
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

// Listen for alarm with error handling
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'periodicLogin') {
    const currentTime = new Date().toLocaleString();
    console.log(`Alarm triggered at: ${currentTime}`);
    await checkAndReconnect();
  }
});

// Handle system resume
chrome.runtime.onSuspendCanceled.addListener(() => {
  const currentTime = new Date().toLocaleString();
  console.log(`Chrome tried to suspend wifix at ${currentTime}`);
  checkAndReconnect();
});
