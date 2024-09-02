import redisClient from '../utils/redis.js';
import dbClient from '../utils/db.js';
import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';

class AuthController {
  // GET /connect
  static async getConnect (req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
    const [email, password] = credentials.split(':');

    if (!email || !password) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const user = await dbClient.db.collection('users').findOne({ email, password: sha1(password) });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = uuidv4();
      await redisClient.set(`auth_${token}`, user._id.toString(), 86400); // 24 hours

      res.status(200).json({ token });
    } catch (err) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // GET /disconnect
  static async getDisconnect (req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const result = await redisClient.del(`auth_${token}`);
      if (result === 1) {
        res.status(204).end();
      } else {
        res.status(401).json({ error: 'Unauthorized' });
      }
    } catch (err) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default AuthController;
