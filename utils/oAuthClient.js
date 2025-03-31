const { google } = require("googleapis");

require('dotenv').config();

const credentials = {
  client_id: process.env.GOOGLE_CLIENT_ID,
  client_secret: process.env.GOOGLE_CLIENT_SECRET,
  redirect_uris: [process.env.GOOGLE_REDIRECT_URI],
};
const oauth2Client = new google.auth.OAuth2(credentials.client_id, credentials.client_secret, credentials.redirect_uris[0]);
oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_API_REFRESH_TOKEN,
});

module.exports = {oauth2Client}