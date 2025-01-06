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
    const response = await fetch("http://172.16.222.1:1000/login?", {
      method: "GET",
      headers: {
        Accept: "/",
        Connection: "keep-alive",
      },
    });
    
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const redirect = doc.querySelector('input[name="4Tredir"]').value;
    const magic = doc.querySelector('input[name="magic"]').value;
    
    const postData = new URLSearchParams({
      "4Tredir": redirect,
      magic: magic,
      username: username,
      password: password
    });
    
    await fetch("http://172.16.222.1:1000/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: postData.toString(),
    });
    
    statusDiv.textContent = 'Login successful!';
  } catch (error) {
    statusDiv.textContent = 'Login failed: ' + error.message;
  }
});
