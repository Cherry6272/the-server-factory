import { PrismaClient, BlockType, TierName } from '@prisma/client';
import * as xlsx from 'xlsx';
import { slugify } from '../src/lib/utils'; // if exists, or I'll implement simple slugify

function toSlug(text: string) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding from Excel...');

  // Wipe catalogue
  await prisma.productTierSelection.deleteMany({});
  await prisma.productTier.deleteMany({});
  await prisma.orderItemOption.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.optionValue.deleteMany({});
  await prisma.optionGroup.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.updateMany({ data: { parentId: null } });
  await prisma.category.deleteMany({});

  const workbook = xlsx.readFile('THESERVERFACTORY.xlsx');

  // Create Categories
  const catRoots = ['Servers', 'Workstations', 'Components'];
  const rootIds: Record<string, string> = {};
  for (let i = 0; i < catRoots.length; i++) {
    const c = await prisma.category.create({
      data: { name: catRoots[i], slug: toSlug(catRoots[i]), isVisible: true, sortOrder: i }
    });
    rootIds[catRoots[i]] = c.id;
  }

  const subCats: Record<string, { parent: string; name: string; slug: string; id?: string }> = {
    'Dell': { parent: 'Servers', name: 'Dell Servers', slug: 'dell-servers' },
    'HPE': { parent: 'Servers', name: 'HPE Servers', slug: 'hpe-servers' },
    'Dell Workstations': { parent: 'Workstations', name: 'Dell Workstations', slug: 'dell-workstations' },
    'HP Workstations': { parent: 'Workstations', name: 'HP Workstations', slug: 'hp-workstations' },
    'RAID Cards': { parent: 'Components', name: 'RAID Cards', slug: 'raid-cards' },
    'Power Supplies': { parent: 'Components', name: 'Power Supplies', slug: 'power-supplies' },
    'LAN Cards': { parent: 'Components', name: 'LAN Cards', slug: 'lan-cards' },
    'SFP Cards': { parent: 'Components', name: 'SFP Cards', slug: 'sfp-cards' },
    'SAS Hard Drives': { parent: 'Components', name: 'SAS Hard Drives', slug: 'sas-hard-drives' },
    'Server CPUs': { parent: 'Components', name: 'Server CPUs', slug: 'server-cpus' },
    'GPUs': { parent: 'Components', name: 'GPUs', slug: 'gpus' },
    'Server Fans': { parent: 'Components', name: 'Server Fans', slug: 'server-fans' },
    'Server RAM': { parent: 'Components', name: 'Server RAM', slug: 'server-ram' },
    'Server Accessories': { parent: 'Components', name: 'Server Accessories', slug: 'server-accessories' },
  };

  for (const key of Object.keys(subCats)) {
    const info = subCats[key];
    const c = await prisma.category.create({
      data: { name: info.name, slug: info.slug, parentId: rootIds[info.parent], isVisible: true }
    });
    subCats[key].id = c.id;
  }

  // Define configurable fields
  const configFields = ['Processor', 'Memory', 'Storage', 'RAID', 'Network', 'Power Supply', 'Graphics'];

  for (const sheetName of workbook.SheetNames) {
    console.log(`Processing sheet: ${sheetName}`);
    const rows = xlsx.utils.sheet_to_json<any>(workbook.Sheets[sheetName]);
    if (rows.length === 0) continue;

    const categoryId = subCats[sheetName]?.id;
    if (!categoryId) {
      console.warn(`No category mapping for sheet ${sheetName}`);
      continue;
    }

    const isConfigurable = ['Dell', 'HPE', 'Dell Workstations', 'HP Workstations'].includes(sheetName);

    if (isConfigurable) {
      // Group by Product
      const productMap = new Map<string, any[]>();
      for (const row of rows) {
        if (!row['Product']) continue;
        if (!productMap.has(row['Product'])) productMap.set(row['Product'], []);
        productMap.get(row['Product'])!.push(row);
      }

      for (const [productName, configs] of productMap.entries()) {
        const slug = toSlug(productName);
        const baseConfig = configs[0];

        const product = await prisma.product.create({
          data: {
            sku: slug,
            name: productName,
            slug: slug,
            brand: sheetName.includes('Dell') ? 'Dell' : (sheetName.includes('HP') ? 'HP' : null),
            shortDesc: baseConfig['Website Description'] || null,
            description: baseConfig['Suitable For'] ? `Suitable For: ${baseConfig['Suitable For']}` : null,
            basePrice: 0,
            stock: 10,
            categoryId: categoryId,
            isActive: true
          }
        });

        // Collect unique options per group
        const groupOptions: Record<string, Set<string>> = {};
        for (const f of configFields) {
          groupOptions[f] = new Set();
          for (const c of configs) {
            if (c[f]) groupOptions[f].add(String(c[f]).trim());
          }
        }

        // Create OptionGroups and OptionValues
        const valIds: Record<string, Record<string, string>> = {}; // groupName -> { label -> id }
        let sortO = 0;
        for (const f of configFields) {
          if (groupOptions[f].size === 0) continue;
          
          const g = await prisma.optionGroup.create({
            data: {
              productId: product.id,
              name: f,
              label: f,
              required: true,
              sortOrder: sortO++
            }
          });
          valIds[f] = {};
          
          let vSort = 0;
          for (const valLabel of groupOptions[f]) {
            const v = await prisma.optionValue.create({
              data: {
                groupId: g.id,
                label: valLabel,
                priceDelta: 0,
                isDefault: vSort === 0,
                stock: 10,
                sortOrder: vSort++
              }
            });
            valIds[f][valLabel] = v.id;
          }
        }

        // Create Tiers
        let i = 0;
        for (const config of configs) {
          let tierName: TierName | null = null;
          let tierLabel = '';
          const cfgStr = (config['Configuration'] || '').toLowerCase();
          
          if (cfgStr.includes('normal') || cfgStr.includes('basic') || (!cfgStr && i === 0)) {
            tierName = 'BASIC';
            tierLabel = 'Normal Configuration';
          } else if (cfgStr.includes('mid') || cfgStr.includes('inter') || (!cfgStr && i === 1)) {
            tierName = 'INTERMEDIATE';
            tierLabel = 'Mid Range Configuration';
          } else if (cfgStr.includes('high') || cfgStr.includes('adv') || (!cfgStr && i === 2)) {
            tierName = 'ADVANCED';
            tierLabel = 'High Range Configuration';
          }
          i++;

          if (tierName) {
            const tier = await prisma.productTier.create({
              data: {
                productId: product.id,
                name: tierName,
                label: tierLabel,
                priceOverride: 0,
                isActive: true
              }
            });

            // Link to option values
            for (const f of configFields) {
              const val = config[f] ? String(config[f]).trim() : null;
              if (val && valIds[f] && valIds[f][val]) {
                await prisma.productTierSelection.create({
                  data: {
                    tierId: tier.id,
                    optionValueId: valIds[f][val]
                  }
                });
              }
            }
          }
        }
      }
    } else {
      // Components
      for (const row of rows) {
        if (!row['Product']) continue;
        const productName = String(row['Product']);
        const slug = toSlug(productName) + '-' + Math.random().toString(36).substring(2, 6);
        const descArr = [];
        for (const k of Object.keys(row)) {
          if (k !== 'Product' && k !== 'Short Website Description' && k !== 'Brand') {
            descArr.push(`- **${k}**: ${row[k]}`);
          }
        }
        
        const product = await prisma.product.create({
          data: {
            sku: slug,
            name: productName,
            slug: slug,
            brand: row['Brand'] ? String(row['Brand']) : null,
            shortDesc: row['Short Website Description'] ? String(row['Short Website Description']) : null,
            description: descArr.join('\n'),
            basePrice: 0,
            stock: 10,
            categoryId: categoryId,
            isActive: true
          }
        });

        let sortO = 0;
        for (const k of Object.keys(row)) {
          if (k !== 'Product' && k !== 'Short Website Description' && k !== 'Brand') {
            await prisma.optionGroup.create({
              data: {
                productId: product.id,
                name: k,
                label: k,
                required: true,
                sortOrder: sortO++,
                values: {
                  create: [{ label: String(row[k]), priceDelta: 0, isDefault: true, stock: 10, sortOrder: 0 }],
                },
              },
            });
          }
        }
      }
    }
  }

  console.log('✨ Excel seeding complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
