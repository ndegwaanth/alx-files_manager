const sha1 = require('sha1');
const dbClient = require('../utils/db');

class UsersController {
  static async postNew (req, res) {
    const { email, password } = req.body;

    // Check if email is missing
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    // Check if password is missing
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    try {
      // Check if the email already exists in the database
      const userExists = await dbClient.db.collection('users').findOne({ email });
      if (userExists) {
        return res.status(400).json({ error: 'Already exist' });
      }

      // Hash the password using SHA1
      const hashedPassword = sha1(password);

      // Insert the new user into the database
      const result = await dbClient.db.collection('users').insertOne({
        email,
        password: hashedPassword
      });

      // Return the new user (only id and email)
      return res.status(201).json({
        id: result.insertedId,
        email
      });
    } catch (err) {
      console.error('Error creating new user:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = UsersController;
