const { MongoClient } = require('mongodb');

class DBClient {
  constructor () {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    // Construct the MongoDB URI
    const mongoURI = `mongodb://${host}:${port}/${database}`;

    // Create the MongoDB client
    this.client = new MongoClient(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Connect to the database
    this.client.connect((err) => {
      if (err) {
        console.error('MongoDB connection error:', err.message);
        return;
      }
      console.log('Connected successfully to MongoDB');
      this.db = this.client.db(database);
    });
  }

  // Check if MongoDB connection is alive
  isAlive () {
    return this.client.isConnected();
  }

  // Get the number of users in the 'users' collection
  // Get the number of users in the 'users' collection
  async nbUsers () {
    try {
      return await this.db.collection('users').countDocuments();
    } catch (err) {
      console.error('Error fetching user count:', err.message);
      return 0;
    }
  }

  // Get the number of files in the 'files' collection
  async nbFiles () {
    try {
      return await this.db.collection('files').countDocuments();
    } catch (err) {
      console.error('Error fetching file count:', err.message);
      return 0;
    }
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
