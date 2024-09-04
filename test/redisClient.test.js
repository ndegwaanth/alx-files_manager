const { expect } = require('chai');
const redisClient = require('../utils/redis');

describe('redisClient', () => {
  it('should be connected to Redis', (done) => {
    redisClient.get('test_key', (err, reply) => {
      expect(err).to.be.null;
      done();
    });
  });

  it('should set and get a value correctly', (done) => {
    redisClient.set('test_key', 'test_value', () => {
      redisClient.get('test_key', (err, reply) => {
        expect(reply).to.equal('test_value');
        done();
      });
    });
  });
});