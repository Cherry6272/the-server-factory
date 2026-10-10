import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const prods = await prisma.product.findMany({
    where: { category: { name: 'RAID Cards' } },
    include: { optionGroups: true, tiers: true }
  });
  console.log(prods.map(p => ({
    name: p.name,
    slug: p.slug,
    isActive: p.isActive,
    hasOptionGroups: p.optionGroups.length > 0,
    category: p.categoryId
  })));
}
main().finally(() => prisma.$disconnect());
