
export async function login(uname, password) {
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

