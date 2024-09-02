const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class AuthController {
  static async getConnect (req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      console.error('Authorization header is missing or incorrect');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');

    if (!email || !password) {
      console.error('Email or password is missing');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Check if the user exists
      const user = await dbClient.db.collection('users').findOne({ email });
      if (!user) {
        console.error('User not found for email:', email);
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Verify the password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.error('Password does not match for email:', email);
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Generate a token and store it in Redis
      const token = uuidv4();
      const tokenKey = `auth_${token}`;
      await redisClient.setEx(tokenKey, 24 * 60 * 60, user._id.toString()); // Set token expiry to 24 hours

      console.log('Generated token for email:', email);
      return res.status(200).json({ token });
    } catch (err) {
      console.error('Error during authentication:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getDisconnect (req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      console.error('X-Token header is missing');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const tokenKey = `auth_${token}`;
    try {
      // Check if the token exists in Redis
      const userId = await redisClient.get(tokenKey);
      if (!userId) {
        console.error('Token not found:', token);
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Delete the token from Redis
      await redisClient.del(tokenKey);
      console.log('Token deleted:', token);
      return res.status(204).send(); // No content
    } catch (err) {
      console.error('Error during token deletion:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = AuthController;
