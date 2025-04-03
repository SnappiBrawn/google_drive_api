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

    async function processFolder(folderId) {
      const filesAndFolders = await listFilesInFolder(folderId, drive);
      const structure = {
        id: folderId,
        contents: {},
      };

      for (const item of filesAndFolders) {
        if (item.mimeType === "application/vnd.google-apps.folder") {
          structure.contents[item.name] = await processFolder(item.id);
        } else {
          structure.contents[item.name] = {
            id: item.id,
            webContentLink: item.webContentLink,
            size: item.size,
            parents: item.parents,
          };
        }
      }
      return structure;
    }

    const topLevelFilesAndFolders = await listFilesInFolder(rootFolderId, drive);
    const finalStructure = {};

    for (const item of topLevelFilesAndFolders) {
      if (item.mimeType === "application/vnd.google-apps.folder") {
        finalStructure[item.name] = await processFolder(item.id);
      } else {
        finalStructure[item.name] = {
          id: item.id,
          webContentLink: item.webContentLink,
          size: item.size,
          parents: item.parents,
        };
      }
    }

    res.json(finalStructure);
  } catch (error) {
    console.error("Error fetching files with structure:", error);
    res.status(500).json({ error: "Failed to retrieve files with structure from Google Drive." });
  }
};

const fetchDirectory = async (req, res) => {
  try {
    const FOLDER_ID = req.body.folderId;
    if (!FOLDER_ID) {
      return res.status(400).json({ error: "Folder ID is required." });
    }
    await oauth2Client.refreshAccessToken();
    const drive = google.drive({ version: "v3", auth: oauth2Client });
    const rootFolderId = FOLDER_ID === "root" ? process.env.GOOGLE_DRIVE_FOLDER_ID : FOLDER_ID;

    const topLevelFilesAndFolders = await listFilesInFolder(rootFolderId, drive);
    const finalStructure = {};

    for (const item of topLevelFilesAndFolders) {
      if (item.mimeType === "application/vnd.google-apps.folder") {
        finalStructure[item.name] = {
          id: item.id,
          contents: {},
        };
      } else {
        finalStructure[item.name] = {
          id: item.id,
          webContentLink: item.webContentLink,
          size: item.size,
          parents: item.parents,
        };
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
  fetchDirectory,
};
