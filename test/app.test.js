const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const app = require('../index');
const chai = require("chai");

chai.use(chaiHttp);
const expect = chai.expect;

describe('test cart', () => {

    before(async () => {
        try {
            await mongoose.connect(process.env.MONGODB_URI_TEST, {
                dbName: 'db_carts'
            });
            console.log('MongoDB connected successfully');
        } catch (error) {
            console.error('Error connecting to MongoDB:', error);
        }
    });

    after(async () => {
        await mongoose.disconnect();
        //await chai.request(app).delete('/products');
    });

    it('should get a cart by id', async () => {
            const resGet = await chai.request(app).get(`/carts/65721e1ab0a3a347e55dc93d`);
            expect(resGet).to.have.status(200);
            expect(resGet.body).to.be.an('object');
            expect(resGet.body.items).to.be.an('array');
    });

    it('should not get a cart by id', async () => {
        const resGet = await chai.request(app).get(`/carts/6570d1c6a5c7e872164cd941`);
        expect(resGet).to.have.status(404);
    });

    it('should not update quantity of product in cart', async () => {
        const res = await chai.request(app).put('/carts/65721e1ab0a3a347e55dc93d/products/65721e1ab0a3a347e55dc93a').send({ quantity: 4 });
        expect(res).to.have.status(404);
    });

    it('should clear cart', async () => {
        const res = await chai.request(app).put('/carts/65721e1ab0a3a347e55dc93d/clear');
        expect(res).to.have.status(200);
        expect(res.body.items).to.be.an('array');
        expect(res.body.items.length).to.equal(0);
    });

    it('should not clear cart', async () => {
        const res = await chai.request(app).put('/carts/6570d1c6a5c7e872164cd941/clear');
        expect(res).to.have.status(404);
    });

    it('should not update quantity because of invalid quantity', async () => {
        const res = await chai.request(app).put('/carts/65721e1ab0a3a347e55dc93d/products/65721e1ab0a3a347e55dc93a').send({ quantity: -1 });
        expect(res).to.have.status(400);
    });

    it('should not update beacuse of invalid cart id', async () => {
        const res = await chai.request(app).put('/carts/6570d1c6a5c7e872164cd941/products/65721e1ab0a3a347e55dc93a').send({ quantity: 4 });
        expect(res).to.have.status(404);
    });

    it('should delete cart', async () => {
        const res = await chai.request(app).delete('/carts/65721e1ab0a3a347e55dc93d');
        expect(res).to.have.status(200);
    });

});
