require('dotenv').config();
const { google } = require('googleapis');
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
);
oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});
const drive = google.drive({ version: 'v3', auth: oauth2Client });
async function testDriveConnection() {
    try {
        const response = await drive.files.list({
            pageSize: 1,
            fields: 'files(id, name)',
        });
        console.log("SUCCESS", response.data.files);
    } catch (error) {
        console.log("FAIL", error);
    }
}
testDriveConnection();
