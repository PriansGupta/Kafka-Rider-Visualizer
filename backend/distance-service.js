const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'distance-service',
    brokers: ['localhost:9092']
});

// CRITICAL: Unique Consumer Group ID.
// Because this is 'distance-group', it gets its own copy of all messages.
const consumer = kafka.consumer({ groupId: 'distance-group' });

const startDistanceService = async () => {
    await consumer.connect();
    console.log('🗺️ Distance Calculating Service started.');

    await consumer.subscribe({ topic: 'delivery-events', fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ message }) => {
            const event = JSON.parse(message.value.toString());

            // Business Logic: Only calculate ETA if the order is in transit
            if (event.status === 'IN_TRANSIT') {
                // In a real app, we'd use Google Maps API here
                const mockEtaMinutes = Math.floor(Math.random() * 15) + 5;
                console.log(`[Distance Service] Order ${event.orderId} - Processing GPS [${event.location.lat.toFixed(4)}, ${event.location.lng.toFixed(4)}]. ETA: ${mockEtaMinutes} mins.`);
            } else if (event.status === 'DELIVERED') {
                console.log(`[Distance Service] Order ${event.orderId} delivered. Archiving route data.`);
            }
        }
    });
};

startDistanceService().catch(console.error);