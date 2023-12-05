const axios = require('axios');

async function getProductDetails(productId) {
    try {
        const response = await axios.get(`${process.env.PRODUCT_SERVICE_URL}/products/${productId}`);
        return response.data;
    } catch (error) {
        return null;
    }
}

module.exports = { getProductDetails };
