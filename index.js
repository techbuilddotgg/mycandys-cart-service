const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const productService = require('./productService');
const Cart = require('./cartModel');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { dbName: 'db_carts' });

const userId = "1"; // Hardcoded userId for testing
const { getProductDetails } = productService;

// Swagger options
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Cart API',
            version: '1.0.0',
            description: 'API documentation for managing user cart.',
        },
        servers: [
            {
                url: `http://localhost:${port}`,
            },
        ],
    },
    apis: ['index.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Get the items in the user's cart with product details
/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Get the items in the user's cart with product details
 *     responses:
 *       '200':
 *         description: Successful response with the user's cart
 *       '500':
 *         description: Internal Server Error
 */
app.get('/cart', async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId });
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Add a product to the user's cart
/**
 * @swagger
 * /cart/add/{productId}:
 *   post:
 *     summary: Add a product to the user's cart
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: ID of the product to be added
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successful response with the updated cart
 *       '404':
 *         description: Product not found
 *       '500':
 *         description: Internal Server Error
 */
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
/**
 * @swagger
 * /cart/delete/{productId}:
 *   delete:
 *     summary: Remove a product from the user's cart completely
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: ID of the product to be removed
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successful response with the updated cart
 *       '404':
 *         description: Product not found in the cart
 *       '500':
 *         description: Internal Server Error
 */
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
/**
 * @swagger
 * /cart/remove/{productId}:
 *   delete:
 *     summary: Decrease the quantity of a product in the cart
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: ID of the product to decrease the quantity
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successful response with the updated cart
 *       '404':
 *         description: Product not found in the cart
 *       '500':
 *         description: Internal Server Error
 */
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
                cart.fullPrice = parseFloat(cart.fullPrice.toFixed(2));
                await cart.save();
                res.status(200).json(cart);
            } else {
                // If quantity is 1, remove the product from the cart
                // Update fullPrice based on the removed item
                cart.fullPrice -= product.price;
                cart.fullPrice = parseFloat(cart.fullPrice.toFixed(2));
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
/**
 * @swagger
 * /cart/clear:
 *   delete:
 *     summary: Clear all items from the user's cart
 *     responses:
 *       '200':
 *         description: Successful response with the cleared cart
 *       '404':
 *         description: Cart not found
 *       '500':
 *         description: Internal Server Error
 */
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

/**
 * @swagger
 * /cart/delete:
 *   delete:
 *     summary: Delete the entire shopping cart.
 *     responses:
 *       200:
 *         description: Successful response when the cart is deleted.
 *       404:
 *         description: Cart not found.
 *       500:
 *         description: Internal Server Error.
 */
app.delete('/cart/delete', async (req, res) => {
    try {
        const cart = await Cart.findOneAndDelete({ userId });

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        res.status(200).json({ message: 'Cart deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});