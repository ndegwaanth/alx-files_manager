// const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');
const { ObjectId } = require('mongodb');
const Bull = require('bull');
const fileQueue = new Bull('fileQueue', 'redis://127.0.0.1:6379'); // Adjust the Redis URL as needed

class FilesController {
  static async postUpload (req, res) {
    try {
      const { name, type, data, parentId, isPublic } = req.body;
      const { userId } = req.user; // Assuming userId is stored in req.user from authentication middleware

      // Validate input data
      if (!name || !type || !data) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Create the file path and save the file locally
      const folderPath = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const filePath = path.join(folderPath, name);
      fs.writeFileSync(filePath, Buffer.from(data, 'base64'));

      // Save the file metadata in the database
      const fileDocument = {
        userId,
        name,
        type,
        isPublic: isPublic || false,
        parentId: parentId || '0',
        localPath: filePath,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const fileCollection = dbClient.db.collection('files');
      const result = await fileCollection.insertOne(fileDocument);
      const file = result.ops[0];

      // If the file is an image, add a job to the queue for thumbnail generation
      if (file.type.startsWith('image/')) {
        await fileQueue.add({
          userId: file.userId,
          fileId: file._id.toString()
        });
      }

      // Return the saved file document as a response
      return res.status(201).json({
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
        localPath: file.localPath,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  }

  static async putPublish (req, res) {
    const token = req.headers['x-token'];
    const fileId = req.params.id;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = await dbClient.db.collection('files').findOne({
      _id: ObjectId(fileId),
      userId: ObjectId(userId)
    });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    await dbClient.db.collection('files').updateOne(
      { _id: ObjectId(fileId) },
      { $set: { isPublic: true } }
    );

    const updatedFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId) });
    return res.status(200).json(updatedFile);
  }

  static async putUnpublish (req, res) {
    const token = req.headers['x-token'];
    const fileId = req.params.id;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = await dbClient.db.collection('files').findOne({
      _id: ObjectId(fileId),
      userId: ObjectId(userId)
    });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    await dbClient.db.collection('files').updateOne(
      { _id: ObjectId(fileId) },
      { $set: { isPublic: false } }
    );

    const updatedFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId) });
    return res.status(200).json(updatedFile);
  }

  static async getFile (req, res) {
    const fileId = req.params.id;
    const token = req.headers['x-token'];
    const size = req.query.size;

    const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId) });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (file.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }

    const userId = token ? await redisClient.get(`auth_${token}`) : null;
    if (!file.isPublic && (!userId || String(userId) !== String(file.userId))) {
      return res.status(404).json({ error: 'Not found' });
    }

    let filePath = file.localPath;
    if (size) {
      const validSizes = [100, 250, 500];
      if (!validSizes.includes(parseInt(size, 10))) {
        return res.status(400).json({ error: 'Invalid size parameter' });
      }
      filePath = `${filePath}_${size}`;
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const mimeType = mime.lookup(file.name) || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }
}

module.exports = FilesController;
