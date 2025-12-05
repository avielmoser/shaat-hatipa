const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Connecting to database...');
        const events = await prisma.analyticsEvent.findMany({ take: 1 });
        console.log('Successfully connected!');
        console.log('Found events:', events);
    } catch (e) {
        console.error('Error connecting to database:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
