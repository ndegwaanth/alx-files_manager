const redis = require('redis');

class RedisClient {
  constructor () {
    // Create a Redis client instance
    this.client = redis.createClient();

    // Handle errors
    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
  }

  // Check if Redis connection is alive
  isAlive () {
    return this.client.connected;
  }

  // Get value from Redis by key
  async get (key) {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, value) => {
        if (err) return reject(err);
        resolve(value);
      });
    });
  }

  // Set value in Redis with an expiration time
  async set (key, value, duration) {
    return new Promise((resolve, reject) => {
      this.client.set(key, value, 'EX', duration, (err, reply) => {
        if (err) return reject(err);
        resolve(reply);
      });
    });
  }

  // Delete value from Redis by key
  async del (key) {
    return new Promise((resolve, reject) => {
      this.client.del(key, (err, reply) => {
        if (err) return reject(err);
        resolve(reply);
      });
    });
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;