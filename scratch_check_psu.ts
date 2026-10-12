import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const c = await prisma.category.findUnique({ where: { slug: 'power-supplies' }, include: { products: true } });
  console.log('Power Supplies count:', c?.products.length);
}
main().finally(() => prisma.$disconnect());
