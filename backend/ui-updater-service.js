const { Kafka } = require('kafkajs');
const { WebSocketServer } = require('ws');

// Set up WebSocket Server on port 8080
const wss = new WebSocketServer({ port: 8080 });
console.log('🔌 WebSocket Server running on ws://localhost:8080');

const kafka = new Kafka({ clientId: 'ui-updater-service', brokers: ['localhost:9092'] });
const consumer = kafka.consumer({ groupId: 'ui-updater-group' });

const startUIService = async () => {
    await consumer.connect();
    console.log('📱 UI Updating Service connected to Kafka.');
    await consumer.subscribe({ topic: 'delivery-events', fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ message }) => {
            const event = JSON.parse(message.value.toString());
            console.log(`[UI Service] -> Broadcasting Status: ${event.status}`);

            // Broadcast this Kafka event to our React App!
            wss.clients.forEach(client => {
                if (client.readyState === 1) { // WebSocket.OPEN
                    client.send(JSON.stringify(event));
                }
            });
        }
    });
};

startUIService().catch(console.error);