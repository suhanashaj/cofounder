require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Multer configuration for temporary file storage
const upload = multer({
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and image files are allowed!'), false);
        }
    }
});

// Google Drive OAuth2 Setup
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
);

oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

// Diagnostic: Test Google Drive Connection
async function testDriveConnection() {
    try {
        console.log("[GDrive] Testing connectivity with OAuth2...");
        const response = await drive.files.list({
            pageSize: 1,
            fields: 'files(id, name)',
        });
        console.log("✅ [GDrive] Connection successful! Found files:", response.data.files.length);
    } catch (error) {
        console.error("❌ [GDrive] Connection FAILED!");
        console.error("[GDrive] Error Detail:", error.message);
        console.log("💡 Ensure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN are correct in .env");
    }
}
testDriveConnection();

/**
 * Helper: Find or create a folder by name under a parent.
 */
async function getOrCreateFolder(folderName, parentId) {
    try {
        console.log(`[GDrive] Checking for folder "${folderName}" in parent "${parentId}"`);
        const response = await drive.files.list({
            q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and trashed = false`,
            fields: 'files(id, name)',
        });

        if (response.data.files && response.data.files.length > 0) {
            console.log(`[GDrive] Found folder "${folderName}" with ID: ${response.data.files[0].id}`);
            return response.data.files[0].id;
        } else {
            console.log(`[GDrive] Creating folder "${folderName}"...`);
            const fileMetadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [parentId],
            };
            const folder = await drive.files.create({
                requestBody: fileMetadata,
                fields: 'id',
            });
            console.log(`[GDrive] Created folder "${folderName}" with ID: ${folder.data.id}`);
            return folder.data.id;
        }
    } catch (error) {
        console.error(`❌ [GDrive] Error in getOrCreateFolder for "${folderName}":`, error.message);
        throw error;
    }
}

/**
 * Upload route: Refactored to use OAuth2 and centralized Drive storage.
 */
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        console.log("[Upload] Request received");
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded.' });
        }

        const { username, role } = req.body;
        if (!username || !role) {
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(400).json({ success: false, message: 'Username and role are required.' });
        }

        const { path: tempPath, originalname, mimetype } = req.file;

        // Root folder ID from .env
        const rootFolderId = process.env.GOOGLE_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID;
        if (!rootFolderId) {
            throw new Error('GOOGLE_FOLDER_ID is not configured in .env');
        }

        console.log(`[Upload] Processing for user: ${username}, role: ${role}`);

        // 1. Get/Create Role Folder
        let roleFolderName = "General";
        const normalizedRole = role.toLowerCase().replace(/[^a-z]/g, "");
        if (normalizedRole.includes("cofounder")) roleFolderName = "Cofounders";
        else if (normalizedRole.includes("founder")) roleFolderName = "Founders";
        else roleFolderName = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

        const roleFolderId = await getOrCreateFolder(roleFolderName, rootFolderId);

        // 2. Get/Create User Folder
        const userFolderId = await getOrCreateFolder(username, roleFolderId);

        // 3. Upload File
        const fileMetadata = {
            name: originalname,
            parents: [userFolderId],
        };

        const media = {
            mimeType: mimetype,
            body: fs.createReadStream(tempPath),
        };

        console.log(`[Upload] Uploading "${originalname}" to GDrive...`);
        const driveResponse = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, webViewLink, webContentLink',
        });

        const fileId = driveResponse.data.id;
        // Construct a direct image URL for display in <img> tags
        const directLink = `https://lh3.googleusercontent.com/d/${fileId}`;
        console.log(`[Upload] Successfully uploaded. ID: ${fileId}`);

        // Optional: Make file public (crucial for direct link to work)
        try {
            await drive.permissions.create({
                fileId: fileId,
                requestBody: {
                    role: 'reader',
                    type: 'anyone',
                },
            });
            console.log(`[Upload] Permissions set to anyone:reader.`);
        } catch (permError) {
            console.warn(`[Upload] Warning: Could not set public permissions: ${permError.message}`);
        }

        // Cleanup temp file
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

        res.json({
            success: true,
            fileId: fileId,
            url: directLink,
            webViewLink: driveResponse.data.webViewLink,
        });

    } catch (error) {
        console.error('❌ [Upload] SERVER ERROR:', error.message);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ success: false, message: err.message });
});

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});
