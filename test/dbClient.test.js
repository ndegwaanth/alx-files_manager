const { expect } = require('chai');
const dbClient = require('../utils/db');

describe('dbClient', () => {
  it('should be connected to MongoDB', () => {
    const isAlive = dbClient.isAlive();
    expect(isAlive).to.be.true;
  });

  it('should return the number of users in the collection', async () => {
    const nbUsers = await dbClient.nbUsers();
    expect(nbUsers).to.be.a('number');
  });

  it('should return the number of files in the collection', async () => {
    const nbFiles = await dbClient.nbFiles();
    expect(nbFiles).to.be.a('number');
  });
});