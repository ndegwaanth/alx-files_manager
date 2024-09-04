describe('GET /files/:id', () => {
  it('should retrieve a specific file by ID', (done) => {
    request(app)
      .get('/files/someFileId')
      .expect(200)
      .end((err, res) => {
        expect(res.body).to.have.property('id');
        expect(res.body).to.have.property('name');
        done();
      });
  });
});

describe('GET /files', () => {
  it('should retrieve files with pagination', (done) => {
    request(app)
      .get('/files?page=0')
      .expect(200)
      .end((err, res) => {
        expect(res.body).to.be.an('array').that.is.not.empty;
        done();
      });
  });
});