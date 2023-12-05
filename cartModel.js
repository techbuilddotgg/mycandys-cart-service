const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    items: [
        {
            productId: String,
            name: String,
            price: Number,
            imgUrl: String,
            quantity: {
                type: Number,
                default: 1,
            },
        },
    ],
    fullPrice: {
        type: Number,
        default: 0,
    },
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
