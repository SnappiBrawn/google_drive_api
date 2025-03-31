const { oauth2Client } = require("../utils/oAuthClient");

const authRoutes = require("express").Router();

//one-time login request to fetch refersh Token
authRoutes.get("/login", (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  console.log(authUrl);
  res.redirect(authUrl);
});

//extracts refresh Token from the success response
authRoutes.get("/login-callback", async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    // Store this token somewhere
    console.log("Refresh Token:", tokens.refresh_token);
    res.send("Authorization successful! You can now use the server.");
  } catch (error) {
    console.error("Error exchanging code for tokens:", error);
    res.status(500).send("Error during authorization.");
  }
});

module.exports = authRoutes;
