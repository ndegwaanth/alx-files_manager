const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');
const { ObjectId } = require('mongodb');

class FilesController {
  static async postUpload (req, res) {
    const { name, type, parentId, isPublic = false, data } = req.body;
    const token = req.headers['x-token'];

    if (!token) {
      console.error('X-Token header is missing');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Retrieve the user based on the token
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        console.error('Token not found:', token);
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!name) {
        console.error('Missing name');
        return res.status(400).json({ error: 'Missing name' });
      }

      if (!type || !['folder', 'file', 'image'].includes(type)) {
        console.error('Invalid or missing type:', type);
        return res.status(400).json({ error: 'Missing or invalid type' });
      }

      if (type !== 'folder' && !data) {
        console.error('Missing data for type:', type);
        return res.status(400).json({ error: 'Missing data' });
      }

      if (parentId) {
        const parentFile = await dbClient.db.collection('files').findOne({ _id: new ObjectId(parentId) });
        if (!parentFile) {
          console.error('Parent file not found for parentId:', parentId);
          return res.status(400).json({ error: 'Parent not found' });
        }
        if (parentFile.type !== 'folder') {
          console.error('Parent file is not a folder for parentId:', parentId);
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      const fileData = { userId, name, type, isPublic, parentId: parentId || 0 };

      if (type === 'folder') {
        const result = await dbClient.db.collection('files').insertOne(fileData);
        console.log('Folder created with name:', name);
        return res.status(201).json({ id: result.insertedId, ...fileData });
      } else {
        const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }

        const fileId = uuidv4();
        const filePath = path.join(folderPath, fileId);
        fs.writeFileSync(filePath, Buffer.from(data, 'base64'));

        fileData.localPath = filePath;
        const result = await dbClient.db.collection('files').insertOne(fileData);
        console.log('File created with name:', name);
        return res.status(201).json({ id: result.insertedId, ...fileData });
      }
    } catch (err) {
      console.error('Error uploading file:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = FilesController;
