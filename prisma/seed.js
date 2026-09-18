import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from "../src/generated/prisma/client.js";
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL is not defined!');
}
const adminEmail = process.env.DEMO_ADMIN_EMAIL?.trim().toLowerCase();
const adminPassword = process.env.DEMO_ADMIN_PASSWORD;
if (!adminEmail || !adminPassword) {
    throw new Error('DEMO_ADMIN_EMAIL and DEMO_ADMIN_PASSWORD must be defined!');
}
if (adminPassword.length < 8) {
    throw new Error('DEMO_ADMIN_PASSWORD must be at least 8 characters long!');
}
const adapter = new PrismaPg({
    connectionString,
});
const prisma = new PrismaClient({
    adapter,
});
const seedAdmin = async () => {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const admin = await prisma.user.upsert({
        where: {
            email: adminEmail,
        },
        update: {
            passwordHash,
            role: 'ADMIN',
            firstName: 'University Management System',
            lastName: 'Admin',
            isActive: true,
            deletedAt: null,
        },
        create: {
            email: adminEmail,
            passwordHash,
            role: 'ADMIN',
            firstName: 'University Management System',
            lastName: 'Admin',
        },
    });
    console.log(`Demo Admin ready: ${admin.email}`);
};
const main = async () => {
    await seedAdmin();
};
main()
    .catch(error => {
    console.error('Seed failed:', error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map