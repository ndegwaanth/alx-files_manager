import redisClient from '../utils/redis.js';
import dbClient from '../utils/db.js';
import sha1 from 'sha1';

class UserController {
  // POST /users
  static async postNew (req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    try {
      const existingUser = await dbClient.db.collection('users').findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Already exists' });
      }

      const newUser = {
        email,
        password: sha1(password)
      };

      const result = await dbClient.db.collection('users').insertOne(newUser);
      res.status(201).json({ id: result.insertedId, email });
    } catch (err) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // GET /users/me
  static async getMe (req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await dbClient.db.collection('users').findOne({ _id: new dbClient.ObjectId(userId) });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      res.status(200).json({ id: user._id.toString(), email: user.email });
    } catch (err) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default UserController;
