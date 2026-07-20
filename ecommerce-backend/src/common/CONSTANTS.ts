export const CONSTANTS = Object.freeze({
    DURATION_REGEX: '^(\d+)(ms|s|m|h|d)$',
    RAW_PRODUCT_COLUMNS: `
        p.id AS id,
        p.name AS name,
        p.description AS description,
        p.sku AS sku,
        p.category_id AS "categoryId",
        c.name AS "categoryName",
        p.price AS price,
        p.currency AS currency,
        p.stock_quantity AS "stockQuantity",
        p.image_url AS "imageUrl",
        p.created_at AS "createdAt"`,
    SPONSOR_FIELD_PROJECTION: [
        'p.id AS id',
        'p.name AS name',
        'p.description AS description',
        'p.price AS price',
        'p.currency AS currency',
        'p.image_url AS "imageUrl"',
        'p.category_id AS "categoryId"',
      ]
})