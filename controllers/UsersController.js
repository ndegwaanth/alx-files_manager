const bcrypt = require('bcrypt');
const dbClient = require('../utils/db');
const { ObjectId } = require('mongodb');
const redisClient = require('../utils/redis');

class UsersController {
  static async postNew (req, res) {
    const { email, password } = req.body;
    console.log('Received data:', { email, password });

    if (!email) {
      console.error('Missing email');
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      console.error('Missing password');
      return res.status(400).json({ error: 'Missing password' });
    }

    try {
      // Check if the user already exists
      const userExists = await dbClient.db.collection('users').findOne({ email });
      if (userExists) {
        console.error('User already exists for email:', email);
        return res.status(400).json({ error: 'Already exists' });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert the new user into the database
      const result = await dbClient.db.collection('users').insertOne({
        email,
        password: hashedPassword
      });

      console.log('New user created with email:', email);
      return res.status(201).json({
        id: result.insertedId,
        email
      });
    } catch (err) {
      console.error('Error creating new user:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getMe (req, res) {
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

      // Retrieve the user from the database
      const user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });
      if (!user) {
        console.error('User not found for userId:', userId);
        return res.status(401).json({ error: 'Unauthorized' });
      }

      console.log('User details retrieved for email:', user.email);
      return res.status(200).json({ id: user._id, email: user.email });
    } catch (err) {
      console.error('Error retrieving user details:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = UsersController;
