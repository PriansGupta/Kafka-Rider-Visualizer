const { Kafka, Partitioners } = require('kafkajs');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors()); // Allow React to call this API

const kafka = new Kafka({ clientId: 'rider-app-producer', brokers: ['localhost:9092'] });
const producer = kafka.producer({ createPartitioner: Partitioners.DefaultPartitioner });

const startRiderSimulation = async () => {
    await producer.connect();
    const orderId = `ORDER-${Math.floor(Math.random() * 10000)}`;
    let lat = 19.0760, lng = 72.8777, steps = 0;

    console.log(`🏍️ New Rider Assigned for ${orderId}`);

    const deliveryInterval = setInterval(async () => {
        steps++;
        lat += 0.0010; lng += 0.0010;
        const isDelivered = steps >= 10;
        const eventStatus = isDelivered ? 'DELIVERED' : 'IN_TRANSIT';

        await producer.send({
            topic: 'delivery-events',
            messages: [{
                key: orderId,
                // We added "step" so the UI knows how far along the line to draw the rider
                value: JSON.stringify({ orderId, location: { lat, lng }, status: eventStatus, step: steps })
            }]
        });

        if (isDelivered) {
            clearInterval(deliveryInterval);
            await producer.disconnect();
        }
    }, 3000);
};

// API Endpoint for React
app.post('/place-order', (req, res) => {
    startRiderSimulation().catch(console.error);
    res.send({ status: 'started' });
});

app.listen(3001, () => {
    console.log('🚀 Producer API listening on http://localhost:3001');
});