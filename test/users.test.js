const request = require('supertest');
const { expect } = require('chai');
const app = require('../app');

describe('POST /users', () => {
  it('should create a new user', (done) => {
    request(app)
      .post('/users')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(201)
      .end((err, res) => {
        expect(res.body).to.have.property('id');
        expect(res.body).to.have.property('email', 'test@example.com');
        done();
      });
  });
});