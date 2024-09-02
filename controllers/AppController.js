import redisClient from '../utils/redis.js';
import dbClient from '../utils/db.js';

class AppController {
  // GET /status
  static getStatus (req, res) {
    res.status(200).json({
      redis: redisClient.isAlive(),
      db: dbClient.isAlive()
    });
  }

  // GET /stats
  static async getStats (req, res) {
    try {
      const users = await dbClient.nbUsers();
      const files = await dbClient.nbFiles();

      res.status(200).json({ users, files });
    } catch (err) {
      res.status(500).json({ error: 'Cannot retrieve stats' });
    }
  }
}

export default AppController;
