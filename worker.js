const Bull = require('bull');
const imageThumbnail = require('image-thumbnail');
const fs = require('fs');
const dbClient = require('./utils/db');

const fileQueue = new Bull('fileQueue', 'redis://127.0.0.1:6379');

fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;

  if (!fileId) {
    throw new Error('Missing fileId');
  }

  if (!userId) {
    throw new Error('Missing userId');
  }

  const file = await dbClient.files.findOne({ _id: fileId, userId });

  if (!file) {
    throw new Error('File not found');
  }

  const filePath = file.localPath; // Assuming file.localPath contains the file's location

  try {
    const thumbnail500 = await imageThumbnail(filePath, { width: 500 });
    const thumbnail250 = await imageThumbnail(filePath, { width: 250 });
    const thumbnail100 = await imageThumbnail(filePath, { width: 100 });

    // Save thumbnails to the same location as the original file
    fs.writeFileSync(`${filePath}_500`, thumbnail500);
    fs.writeFileSync(`${filePath}_250`, thumbnail250);
    fs.writeFileSync(`${filePath}_100`, thumbnail100);
  } catch (error) {
    console.error('Error generating thumbnails:', error);
  }
});
