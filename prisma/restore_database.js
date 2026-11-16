const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

function chunk(arr, size = 50) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

async function restore() {
  const filePath = path.resolve(__dirname, 'backup_database.json');
  if (!fs.existsSync(filePath)) {
    console.error(`Backup file not found at ${filePath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`Starting fast batch restore...`);

  try {
    // 1. Users
    console.log(`Restoring ${data.users.length} users...`);
    for (const batch of chunk(data.users)) {
      await prisma.user.createMany({
        data: batch.map((u) => ({
          ...u,
          createdAt: new Date(u.createdAt),
          updatedAt: new Date(u.updatedAt),
        })),
        skipDuplicates: true,
      });
    }

    // 2. Categories (roots then children)
    console.log(`Restoring categories...`);
    const roots = data.categories.filter((c) => !c.parentId);
    const children = data.categories.filter((c) => c.parentId);

    await prisma.category.createMany({
      data: roots,
      skipDuplicates: true,
    });
    await prisma.category.createMany({
      data: children,
      skipDuplicates: true,
    });

    // 3. Products
    console.log(`Restoring ${data.products.length} products...`);
    const allImages = [];
    const productsData = data.products.map((p) => {
      const { images, ...productData } = p;
      if (images && images.length > 0) {
        for (const img of images) {
          allImages.push({
            id: img.id,
            productId: p.id,
            url: img.url,
            publicId: img.publicId,
            alt: img.alt,
            sortOrder: img.sortOrder,
          });
        }
      }
      return {
        ...productData,
        basePrice: Number(productData.basePrice),
        createdAt: new Date(productData.createdAt),
        updatedAt: new Date(productData.updatedAt),
      };
    });

    for (const batch of chunk(productsData)) {
      await prisma.product.createMany({
        data: batch,
        skipDuplicates: true,
      });
    }

    if (allImages.length > 0) {
      console.log(`Restoring ${allImages.length} product images...`);
      for (const batch of chunk(allImages)) {
        await prisma.productImage.createMany({
          data: batch,
          skipDuplicates: true,
        });
      }
    }

    // 4. Option Groups & Values
    console.log(`Restoring ${data.optionGroups.length} option groups...`);
    const allValues = [];
    const groupsData = data.optionGroups.map((og) => {
      const { values, ...groupData } = og;
      if (values && values.length > 0) {
        for (const v of values) {
          allValues.push({
            ...v,
            priceDelta: Number(v.priceDelta),
          });
        }
      }
      return groupData;
    });

    for (const batch of chunk(groupsData)) {
      await prisma.optionGroup.createMany({
        data: batch,
        skipDuplicates: true,
      });
    }

    if (allValues.length > 0) {
      console.log(`Restoring ${allValues.length} option values...`);
      for (const batch of chunk(allValues)) {
        await prisma.optionValue.createMany({
          data: batch,
          skipDuplicates: true,
        });
      }
    }

    // 5. Tiers & Selections
    console.log(`Restoring ${data.tiers.length} tiers...`);
    const allSelections = [];
    const tiersData = data.tiers.map((t) => {
      const { selections, ...tierData } = t;
      if (selections && selections.length > 0) {
        for (const s of selections) {
          allSelections.push(s);
        }
      }
      return {
        ...tierData,
        priceOverride: tierData.priceOverride ? Number(tierData.priceOverride) : null,
      };
    });

    for (const batch of chunk(tiersData)) {
      await prisma.productTier.createMany({
        data: batch,
        skipDuplicates: true,
      });
    }

    if (allSelections.length > 0) {
      console.log(`Restoring ${allSelections.length} tier selections...`);
      for (const batch of chunk(allSelections)) {
        await prisma.productTierSelection.createMany({
          data: batch,
          skipDuplicates: true,
        });
      }
    }

    // 6. Orders
    console.log(`Restoring ${data.orders.length} orders...`);
    for (const o of data.orders) {
      const { items, ...orderData } = o;
      await prisma.order.upsert({
        where: { id: o.id },
        update: {},
        create: {
          ...orderData,
          total: Number(orderData.total),
          createdAt: new Date(orderData.createdAt),
          updatedAt: new Date(orderData.updatedAt),
        },
      });

      if (items && items.length > 0) {
        for (const item of items) {
          const { options, ...itemData } = item;
          await prisma.orderItem.upsert({
            where: { id: item.id },
            update: {},
            create: {
              ...itemData,
              unitPrice: Number(itemData.unitPrice),
              lineTotal: Number(itemData.lineTotal),
            },
          });

          if (options && options.length > 0) {
            for (const opt of options) {
              await prisma.orderItemOption.upsert({
                where: { id: opt.id },
                update: {},
                create: {
                  ...opt,
                  priceDelta: Number(opt.priceDelta),
                },
              });
            }
          }
        }
      }
    }

    // 7. Landing Blocks
    console.log(`Restoring ${data.landingBlocks.length} landing blocks...`);
    for (const lb of data.landingBlocks) {
      await prisma.landingBlock.upsert({
        where: { id: lb.id },
        update: {},
        create: lb,
      });
    }

    console.log('✅ ALL DATA RESTORED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Restore error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

restore();
