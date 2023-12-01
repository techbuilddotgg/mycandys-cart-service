const axios = require('axios');

async function getProductDetails(productId) {
    try {
        const response = await axios.get(`http://localhost:3002/products/${productId}`);
        return response.data;
    } catch (error) {
        return null;
    }
}

module.exports = { getProductDetails };
