const amqp = require('amqplib');
const dotenv = require('dotenv');

dotenv.config();

const rabbitMQURL = process.env.RABBITMQ_URL;
const rabbitMQExchange =process.env.RABBITMQ_EXCHANGE;
const rabbitMQQueue = process.env.RABBITMQ_QUEUE;

let rabbitMQChannel;

async function setupRabbitMQ() {
    try {
        const connection = await amqp.connect(rabbitMQURL);
        rabbitMQChannel = await connection.createChannel();
        await rabbitMQChannel.assertExchange(rabbitMQExchange, 'direct', { durable: true });
        await rabbitMQChannel.assertQueue(rabbitMQQueue, { durable: true });
        await rabbitMQChannel.bindQueue(rabbitMQQueue, rabbitMQExchange, '');
        console.log('Connected to RabbitMQ')
    } catch (error) {
        console.error('Error connecting to RabbitMQ:', error);
    }
}

function getRabbitMQChannel() {
    return rabbitMQChannel;
}

module.exports = { setupRabbitMQ, getRabbitMQChannel };
