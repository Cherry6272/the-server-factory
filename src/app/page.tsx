import { prisma } from '@/lib/prisma';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { PromoBanner } from '@/components/home/PromoBanner';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { BrandLogos } from '@/components/home/BrandLogos';
import { CtaBlock } from '@/components/home/CtaBlock';

export const revalidate = 60; // ISR - refresh homepage every minute

export default async function HomePage() {
  const blocks = await prisma.landingBlock
    .findMany({ where: { isVisible: true }, orderBy: { sortOrder: 'asc' } })
    .catch(() => []);

  return (
    <div>
      {blocks.map((block) => {
        const data = block.data as any;
        const inner = (() => {
          switch (block.type) {
            case 'HERO_CAROUSEL':    return <HeroCarousel slides={data.slides ?? []} />;
            case 'PROMO_BANNER':     return <PromoBanner text={data.text} link={data.link} bgColor={data.bgColor} />;
            case 'FEATURED_PRODUCTS': return <FeaturedProducts heading={data.heading} limit={data.limit ?? 8} />;
            case 'CATEGORY_GRID':    return <CategoryGrid heading={data.heading} />;
            case 'BRAND_LOGOS':      return <BrandLogos heading={data.heading} brands={data.brands ?? []} />;
            case 'CTA':              return <CtaBlock {...data} />;
            default:                 return null;
          }
        })();
        if (!inner) return null;
        return (
          <div key={block.id} style={data.sectionBg ? { backgroundColor: data.sectionBg } : undefined}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
