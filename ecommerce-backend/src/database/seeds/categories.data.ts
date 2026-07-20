export interface CategorySeed {
  name: string;
  slug: string;
  adjectives: string[];
  nouns: string[];
}

export const CATEGORIES: CategorySeed[] = [
  {
    name: 'Electronics',
    slug: 'electronics',
    adjectives: ['Wireless', 'Bluetooth', 'Portable', 'Smart', 'Rechargeable', 'Noise-Cancelling', 'HD', 'Ultra-Slim'],
    nouns: ['Headphones', 'Speaker', 'Charger', 'Webcam', 'Router', 'Monitor', 'Keyboard', 'Mouse', 'Power Bank', 'Smartwatch'],
  },
  {
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    adjectives: ['Stainless Steel', 'Non-Stick', 'Ceramic', 'Electric', 'Compact', 'Insulated', 'Cast Iron'],
    nouns: ['Blender', 'Kettle', 'Cutting Board', 'Skillet', 'Coffee Maker', 'Mixing Bowl', 'Toaster', 'Knife Set', 'Air Fryer'],
  },
  {
    name: 'Sports & Outdoors',
    slug: 'sports-outdoors',
    adjectives: ['Adjustable', 'Foldable', 'All-Weather', 'Lightweight', 'Heavy-Duty', 'Anti-Slip'],
    nouns: ['Yoga Mat', 'Dumbbell Set', 'Tent', 'Hiking Backpack', 'Water Bottle', 'Resistance Band', 'Bike Helmet', 'Camping Chair'],
  },
  {
    name: 'Books',
    slug: 'books',
    adjectives: ['Illustrated', 'Bestselling', 'Annotated', 'Collector\u2019s Edition', 'Beginner\u2019s'],
    nouns: ['Novel', 'Cookbook', 'Field Guide', 'Biography', 'Journal', 'Anthology', 'Study Guide'],
  },
  {
    name: 'Toys & Games',
    slug: 'toys-games',
    adjectives: ['Wooden', 'Interactive', 'Educational', 'Glow-in-the-Dark', 'Magnetic'],
    nouns: ['Puzzle', 'Building Blocks', 'Board Game', 'Action Figure', 'Card Game', 'Plush Toy', 'Model Kit'],
  },
  {
    name: 'Beauty & Personal Care',
    slug: 'beauty-personal-care',
    adjectives: ['Organic', 'Fragrance-Free', 'Hydrating', 'Long-Lasting', 'Dermatologist-Tested'],
    nouns: ['Moisturizer', 'Shampoo', 'Lip Balm', 'Face Serum', 'Electric Trimmer', 'Hair Dryer', 'Sunscreen'],
  },
  {
    name: 'Automotive',
    slug: 'automotive',
    adjectives: ['Universal', 'Heavy-Duty', 'Weatherproof', 'Quick-Release', 'LED'],
    nouns: ['Dash Cam', 'Floor Mat', 'Car Charger', 'Tire Inflator', 'Seat Cover', 'Jump Starter', 'Roof Rack'],
  },
  {
    name: 'Grocery',
    slug: 'grocery',
    adjectives: ['Organic', 'Gluten-Free', 'Single-Origin', 'Cold-Pressed', 'Small-Batch'],
    nouns: ['Coffee Beans', 'Olive Oil', 'Pasta', 'Trail Mix', 'Green Tea', 'Honey', 'Protein Powder'],
  },
  {
    name: 'Clothing',
    slug: 'clothing',
    adjectives: ['Slim-Fit', 'Water-Resistant', 'Breathable', 'Reversible', 'Quick-Dry'],
    nouns: ['Jacket', 'Running Shoes', 'Hoodie', 'Jeans', 'Beanie', 'Rain Coat', 'Backpack'],
  },
  {
    name: 'Office Supplies',
    slug: 'office-supplies',
    adjectives: ['Ergonomic', 'Adjustable', 'Refillable', 'Heavy-Duty', 'Compact'],
    nouns: ['Desk Lamp', 'Office Chair', 'Notebook', 'Stapler', 'Standing Desk', 'Whiteboard', 'Pen Set'],
  },
];
