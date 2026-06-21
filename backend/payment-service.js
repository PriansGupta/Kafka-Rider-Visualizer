const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'payment-service',
    brokers: ['localhost:9092']
});

// CRITICAL: Unique Consumer Group ID.
// Because this is 'payment-group', it gets its own copy of all messages.
const consumer = kafka.consumer({ groupId: 'payment-group' });

const startPaymentService = async () => {
    await consumer.connect();
    console.log('💳 Payment Service started.');

    await consumer.subscribe({ topic: 'delivery-events', fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ message }) => {
            const event = JSON.parse(message.value.toString());

            // Business Logic: The payment service doesn't care about GPS pings.
            // It ONLY acts when an order is finalized.
            if (event.status === 'DELIVERED') {
                console.log(`\n[Payment Service] 🚨 TRIGGER DETECTED: Order ${event.orderId} delivered!`);
                console.log(`[Payment Service] Processing $5.00 payout to Rider ${event.riderId}...`);
                console.log(`[Payment Service] Charging Customer Card... Transaction Complete. ✅\n`);
            } else {
                // Ignoring IN_TRANSIT events silently to save compute
            }
        }
    });
};

startPaymentService().catch(console.error);