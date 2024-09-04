const request = require('supertest');
const { expect } = require('chai');
const app = require('../app'); // Assume your Express app is exported in app.js

describe('GET /status', () => {
  it('should return the status of the API', (done) => {
    request(app)
      .get('/status')
      .expect(200)
      .end((err, res) => {
        expect(res.body).to.have.property('redis');
        expect(res.body).to.have.property('db');
        done();
      });
  });
});

describe('GET /stats', () => {
  it('should return the stats of the API', (done) => {
    request(app)
      .get('/stats')
      .expect(200)
      .end((err, res) => {
        expect(res.body).to.have.property('users');
        expect(res.body).to.have.property('files');
        done();
      });
  });
});