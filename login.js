// Remove cheerio dependency and use DOMParser instead
async function login(uname, password) {
  try {
    console.log("Starting login process...");
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
login("2024BCD0023", "EVAtNy42");

// export default login;
