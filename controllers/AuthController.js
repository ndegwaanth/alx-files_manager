const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');
const sha1 = require('sha1');
const { v4: uuidv4 } = require('uuid');

class AuthController {
    static async getConnect(req, res) {
        const authHeader = req.headers.authorization || '';
        const base64Credentials = authHeader.split(' ')[1] || '';
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [email, password] = credentials.split(':');

        if (!email || !password) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const hashedPassword = sha1(password);
        const user = await dbClient.usersCollection.findOne({ email, password: hashedPassword });

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = uuidv4();
        const key = `auth_${token}`;
        await redisClient.set(key, user._id.toString(), 86400);

        return res.status(200).json({ token });
    }

    static async getDisconnect(req, res) {
        const token = req.headers['x-token'];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const tokenKey = `auth_${token}`;
        const userId = await redisClient.get(tokenKey);

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await redisClient.del(tokenKey);
        return res.status(204).send();
    }
}

module.exports = AuthController;