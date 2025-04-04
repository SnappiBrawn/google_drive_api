require("dotenv").config();
const { google } = require("googleapis");
const { oauth2Client } = require("../utils/oAuthClient");

async function listFilesInFolder(folderId, drive) {
  const results = [];
  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "nextPageToken, files(id, name, mimeType, webContentLink, size, parents)",
    pageSize: 1000,
  });
  results.push(...response.data.files);
  let pageToken = response.data.nextPageToken;
  while (pageToken) {
    const nextResponse = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType, webContentLink, size, parents)",
      pageSize: 1000,
      pageToken: pageToken,
    });
    results.push(...nextResponse.data.files);
    pageToken = nextResponse.data.nextPageToken;
  }
  return results;
}

const fetchAllFiles = async (req, res) => {
  try {
    await oauth2Client.refreshAccessToken();
    const drive = google.drive({ version: "v3", auth: oauth2Client });
    const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    const structure = [];
    async function processFolder(folderId) {
      const filesAndFolders = await listFilesInFolder(folderId, drive);
      for (const item of filesAndFolders) {
        if (item.mimeType === "application/vnd.google-apps.folder") {
          structure.push({
            name: item.name,
            id: item.id,
            parent: (folderId === rootFolderId)?"root":folderId,
          })
          await processFolder(item.id);
        } else {
          structure.push({
            name: item.name,
            id: item.id,
            webContentLink: item.webContentLink,
            size: item.size,
            parent: (folderId === rootFolderId)?"root":folderId,
          })
        }
      }
      return structure;
    }

    const finalStructure = await processFolder(rootFolderId);

    res.json(finalStructure);
  } catch (error) {
    console.error("Error fetching files with structure:", error);
    res.status(500).json({ error: "Failed to retrieve files with structure from Google Drive." });
  }
};

const fetchFiles = async (req,res) => {
  try {
    const FOLDER_ID = req.body.folderId;
    if (!FOLDER_ID) {
      return res.status(400).json({ error: "Folder ID is required." });
    }
    await oauth2Client.refreshAccessToken();
    const drive = google.drive({ version: "v3", auth: oauth2Client });
    const rootFolderId = FOLDER_ID === "root" ? process.env.GOOGLE_DRIVE_FOLDER_ID : FOLDER_ID;

    const currentFolder = await listFilesInFolder(rootFolderId, drive);
    const finalStructure = [];

    for (const item of currentFolder) {
      if (item.mimeType === "application/vnd.google-apps.folder") {
        finalStructure.push({
          name: item.name,
          id: item.id,
          parent: FOLDER_ID,
        });
      } else {
        finalStructure.push({
          name: item.name,
          id: item.id,
          webContentLink: item.webContentLink,
          size: item.size,
          parent: FOLDER_ID === "root" ? "root" : item.parents[0],
        });
      }
    }

    res.json(finalStructure);
  } catch (error) {
    console.error("Error fetching files with structure:", error);
    res.status(500).json({ error: "Failed to retrieve files with structure from Google Drive." });
  }
};

module.exports = {
  fetchAllFiles,
  fetchFiles
};
