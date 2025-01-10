async function login(uname, password) {
  try {
    const logoutFetched = await fetch("http://172.16.222.1:1000/logout?0307020009020400", {
      "headers": {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "accept-language": "en-US,en",
        "sec-gpc": "1",
        "upgrade-insecure-requests": "1",
        "Referer": "http://172.16.222.1:1000/keepalive?0307020009020400",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      "body": null,
      "method": "GET"
    }).catch(() => {console.log("failed to logout")})

    console.log("Starting login process...");
    const response = await fetch("http://172.16.222.1:1000/login?0330598d1f22608a", {
      method: "GET",
      headers: {
        Accept: "/",
        Connection: "keep-alive",
      },
    });
    if (!response.ok) {
      console.log("Not connected to IIIT network");
      return "notconnected";
    }
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

    const nowConnectedFetch = await fetch("http://172.16.222.1:1000/keepalive?0001080905090609", {
      headers: {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "accept-language": "en-US,en",
        "cache-control": "max-age=0",
        "sec-gpc": "1",
        "upgrade-insecure-requests": "1",
        "Referer": "http://172.16.222.1:1000/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      method: "GET"
    }).catch(() => {});

    if (!nowConnectedFetch || !nowConnectedFetch.ok) {
      console.error("Invalid credentials");
      return false;
    }

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
});

document.getElementById('loginBtn').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  if (!username || !password) {
    statusDiv.textContent = 'Please enter both username and password';
    return;
  }

  statusDiv.textContent = 'Logging in...';
  
  try {
    const result = await login(username, password);
    if (result === 'notconnected') {
      statusDiv.textContent = 'Not connected to IIIT Kottayam';
    } else if (result) {
      statusDiv.textContent = 'Login successful! Auto-login enabled.';
    } else {
      statusDiv.textContent = 'Invalid credentials';
    }
  } catch (error) {
    statusDiv.textContent = 'Login failed: ' + error.message;
  }
});
