const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const productService = require('./productService');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { dbName: 'db_carts' });

// Schema for the shopping cart
const cartSchema = new mongoose.Schema({
    userId: String,
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

const userId = "1"; // Hardcoded userId for testing
const { getProductDetails } = productService;

// Get the items in the user's cart with product details
app.get('/cart', async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId });
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Add a product to the user's cart
app.post('/cart/add/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        let cart = await Cart.findOne({ userId });

        // If the user doesn't have a cart, create a new one
        if (!cart) {
            const newCart = new Cart({ userId, items: [], fullPrice: 0 });
            await newCart.save();
            // Assign the newly created cart to the 'cart' variable
            cart = newCart;
        }

        // Fetch product details from the products microservice
        const product = await getProductDetails(productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const existingItem = cart.items.find(item => item.productId === productId);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.items.push({
                productId: product._id,
                name: product.name,
                price: product.price,
                imgUrl: product.imgUrl,
                quantity: 1,
            });
        }

        // Update the fullPrice of the cart based on the added item
        cart.fullPrice += product.price;

        await cart.save();
        res.status(200).json(cart);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Update the quantity of a product in the cart
app.put('/cart/update/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Fetch product details from the products microservice
        const product = await getProductDetails(productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const existingItem = cart.items.find(item => item.productId === productId);

        if (existingItem) {
            // Update fullPrice based on the change in quantity
            cart.fullPrice += (quantity - existingItem.quantity) * product.price;
            existingItem.quantity = quantity;

            await cart.save();
            res.status(200).json(cart);
        } else {
            res.status(404).json({ error: 'Product not found in the cart' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Remove a product from the user's cart completely
app.delete('/cart/delete/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Fetch product details from the products microservice
        const product = await getProductDetails(productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Update fullPrice based on the removed item
        const removedItem = cart.items.find(item => item.productId === productId);
        if (removedItem) {
            cart.fullPrice -= removedItem.quantity * product.price;
        }

        cart.items = cart.items.filter(item => item.productId !== productId);
        await cart.save();
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Decrease the quantity of a product in the cart
app.delete('/cart/remove/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Fetch product details from the products microservice
        const product = await getProductDetails(productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const existingItem = cart.items.find(item => item.productId === productId);

        if (existingItem) {
            if (existingItem.quantity > 1) {
                existingItem.quantity -= 1;
                // Update fullPrice based on the decreased quantity
                cart.fullPrice -= product.price;
                await cart.save();
                res.status(200).json(cart);
            } else {
                // If quantity is 1, remove the product from the cart
                // Update fullPrice based on the removed item
                cart.fullPrice -= product.price;
                cart.items = cart.items.filter(item => item.productId !== productId);
                await cart.save();
                res.status(200).json(cart);
            }
        } else {
            res.status(404).json({ error: 'Product not found in the cart' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Clear all items from the user's cart
app.delete('/cart/clear', async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Update fullPrice based on the cleared items
        cart.fullPrice = 0;

        cart.items = [];
        await cart.save();
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
