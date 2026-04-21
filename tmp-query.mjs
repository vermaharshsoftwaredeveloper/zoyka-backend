import prisma from './src/config/prisma.js';
const rows = await prisma.$queryRaw`SELECT o.id as outlet_id, o.parentOutletId, o.ownerId, u.role, u.name as owner_name, o.name as outlet_name FROM "Outlet" o LEFT JOIN "User" u on u.id = o.ownerId WHERE u.role = 'ARTISAN' ORDER BY o.createdAt DESC LIMIT 20`;
console.log(JSON.stringify(rows, null, 2));
await prisma.$disconnect();
