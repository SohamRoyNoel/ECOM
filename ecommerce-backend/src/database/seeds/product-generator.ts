import { faker } from '@faker-js/faker';
import { CATEGORIES } from './categories.data';

export interface GeneratedProduct {
  name: string;
  description: string;
  sku: string;
  categorySlug: string;
  price: string;
  currency: string;
  stockQuantity: number;
  imageUrl: string;
}

export function generateProducts(count: number): GeneratedProduct[] {
  faker.seed(42);
  const products: GeneratedProduct[] = [];
  const usedSkus = new Set<string>();
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    const category = CATEGORIES[i % CATEGORIES.length];
    const adjective = faker.helpers.arrayElement(category.adjectives);
    const noun = faker.helpers.arrayElement(category.nouns);
    const brand = faker.company.name().replace(/[^a-zA-Z0-9 ]/g, '').split(' ')[0];

    let name = `${brand} ${adjective} ${noun}`;
    let suffix = '';
    let attempt = 0;
    while (usedNames.has(name + suffix)) {
      attempt += 1;
      suffix = ` ${faker.string.alphanumeric({ length: 4, casing: 'upper' })}`;
      if (attempt > 20) break;
    }
    name = name + suffix;
    usedNames.add(name);

    let sku = faker.string.alphanumeric({ length: 8, casing: 'upper' });
    while (usedSkus.has(sku)) {
      sku = faker.string.alphanumeric({ length: 8, casing: 'upper' });
    }
    usedSkus.add(sku);

    const description = `${faker.commerce.productDescription()} Ideal for anyone looking for a reliable ${noun.toLowerCase()} in the ${category.name.toLowerCase()} category.`;

    products.push({
      name,
      description,
      sku: `${category.slug.slice(0, 3).toUpperCase()}-${sku}`,
      categorySlug: category.slug,
      price: faker.commerce.price({ min: 5, max: 999, dec: 2 }),
      currency: 'USD',
      stockQuantity: faker.number.int({ min: 0, max: 500 }),
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent(sku)}/600/600`,
    });
  }

  return products;
}
