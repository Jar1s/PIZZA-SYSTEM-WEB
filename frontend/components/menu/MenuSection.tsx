'use client';

import { Product } from '@/shared';
import { ProductCard } from './ProductCard';

interface MenuSectionProps {
  category: string;
  products: Product[];
}

export function MenuSection({ category, products }: MenuSectionProps) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-semibold mb-4 capitalize">{category}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}














