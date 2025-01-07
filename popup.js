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
    
    // Replace DOM parsing with regex
    const redirectRegex = /4Tredir" value="([^"]+)"/;
    const magicRegex = /magic" value="([^"]+)"/;
    
    const redirect = html.match(redirectRegex)?.[1];
    const magic = html.match(magicRegex)?.[1];

    // ...existing logging code...
    console.log(magic)
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

// Load stored credentials when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  const { username, password } = await chrome.storage.local.get(['username', 'password']);
  if (username) document.getElementById('username').value = username;
  if (password) document.getElementById('password').value = password;

  const { isWifixing } = await chrome.storage.local.get(['isWifixing']);
  const toggle = document.getElementById('wifixToggle');
  const toggleStatus = document.getElementById('toggleStatus');
  
  toggle.checked = isWifixing ?? true;  // Changed default to true
  toggleStatus.textContent = toggle.checked ? 'Wifixing' : 'Not Wifixing';
});

document.getElementById('wifixToggle').addEventListener('change', async (e) => {
  const isWifixing = e.target.checked;
  document.getElementById('toggleStatus').textContent = isWifixing ? 'Wifixing' : 'Not Wifixing';
  await chrome.storage.local.set({ isWifixing });
  
  if (isWifixing) {
    chrome.alarms.create('periodicLogin', { periodInMinutes: 1 });
  } else {
    chrome.alarms.clear('periodicLogin');
  }
});

document.getElementById('loginBtn').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  if (!username || !password) {
    statusDiv.textContent = 'Please enter both username and password';
    return;
  }

  // Store credentials for background login
  await chrome.storage.local.set({ username, password });

  statusDiv.textContent = 'Logging in...';
  
  try {
    const success = await login(username, password);
    if (success) {
      statusDiv.textContent = 'Login successful! Auto-login enabled.';
    } else {
      statusDiv.textContent = 'Login failed';
    }
  } catch (error) {
    statusDiv.textContent = 'Login failed: ' + error.message;
  }
});
