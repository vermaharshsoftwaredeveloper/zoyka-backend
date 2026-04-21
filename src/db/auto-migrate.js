/**
 * Auto-migration: runs raw SQL to bring the DB up to the latest schema.
 * Safe to run on every startup — all statements are idempotent (IF NOT EXISTS).
 */
import prisma from "../config/prisma.js";

const steps = [
  {
    name: "Create ProductVariant table",
    sql: `
      CREATE TABLE IF NOT EXISTS "ProductVariant" (
        "id"           TEXT NOT NULL,
        "productId"    TEXT NOT NULL,
        "label"        TEXT NOT NULL,
        "sellingPrice" DOUBLE PRECISION NOT NULL,
        "actualPrice"  DOUBLE PRECISION NOT NULL,
        "stock"        INTEGER NOT NULL DEFAULT 0,
        "isActive"     BOOLEAN NOT NULL DEFAULT true,
        "sortOrder"    INTEGER NOT NULL DEFAULT 0,
        "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
      );
    `,
  },
  {
    name: "ProductVariant.productId FK",
    sql: `
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'ProductVariant_productId_fkey'
        ) THEN
          ALTER TABLE "ProductVariant"
          ADD CONSTRAINT "ProductVariant_productId_fkey"
          FOREIGN KEY ("productId") REFERENCES "Product"("id")
          ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `,
  },
  {
    name: "ProductVariant indexes",
    sql: `
      CREATE INDEX IF NOT EXISTS "ProductVariant_productId_idx" ON "ProductVariant"("productId");
      CREATE INDEX IF NOT EXISTS "ProductVariant_isActive_idx"  ON "ProductVariant"("isActive");
    `,
  },
  {
    name: "ProductImage.variantId column",
    sql: `ALTER TABLE "ProductImage" ADD COLUMN IF NOT EXISTS "variantId" TEXT;`,
  },
  {
    name: "ProductImage.variantId FK",
    sql: `
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'ProductImage_variantId_fkey'
        ) THEN
          ALTER TABLE "ProductImage"
          ADD CONSTRAINT "ProductImage_variantId_fkey"
          FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id")
          ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `,
  },
  {
    name: "CartItem.variantId column",
    sql: `ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "variantId" TEXT;`,
  },
  {
    name: "CartItem.variantId FK",
    sql: `
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'CartItem_variantId_fkey'
        ) THEN
          ALTER TABLE "CartItem"
          ADD CONSTRAINT "CartItem_variantId_fkey"
          FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id")
          ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END $$;
    `,
  },
  {
    name: "Drop old CartItem unique (cartId, productId)",
    sql: `ALTER TABLE "CartItem" DROP CONSTRAINT IF EXISTS "CartItem_cartId_productId_key";`,
  },
  {
    name: "CartItem unique index (cartId, productId, variantId)",
    sql: `
      CREATE UNIQUE INDEX IF NOT EXISTS "CartItem_cartId_productId_variantId_key"
      ON "CartItem"("cartId", "productId", "variantId");
    `,
  },
  {
    name: "Order.variantId column",
    sql: `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "variantId" TEXT;`,
  },
  {
    name: "Order.variantLabel column",
    sql: `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "variantLabel" TEXT;`,
  },
  {
    name: "Order.variantId FK",
    sql: `
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'Order_variantId_fkey'
        ) THEN
          ALTER TABLE "Order"
          ADD CONSTRAINT "Order_variantId_fkey"
          FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id")
          ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END $$;
    `,
  },
];

export const runAutoMigrate = async () => {
  // Quick check: if ProductVariant already exists, skip migration
  const [{ exists }] = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'ProductVariant'
    ) AS exists;
  `;

  if (exists) {
    // Still check for newer columns (variantId in ProductImage/CartItem/Order)
    await ensureColumns();
    return;
  }

  console.log("[auto-migrate] Running variant schema migration...");
  for (const step of steps) {
    try {
      await prisma.$executeRawUnsafe(step.sql);
      console.log(`[auto-migrate] ✅ ${step.name}`);
    } catch (err) {
      console.error(`[auto-migrate] ❌ ${step.name}: ${err.message}`);
    }
  }
  console.log("[auto-migrate] Done.");
};

// Ensure newer columns exist even if ProductVariant table was already created earlier
const ensureColumns = async () => {
  const colChecks = [
    { table: "ProductImage", column: "variantId", sql: `ALTER TABLE "ProductImage" ADD COLUMN IF NOT EXISTS "variantId" TEXT;` },
    { table: "CartItem",     column: "variantId", sql: `ALTER TABLE "CartItem"     ADD COLUMN IF NOT EXISTS "variantId" TEXT;` },
    { table: "Order",        column: "variantId", sql: `ALTER TABLE "Order"        ADD COLUMN IF NOT EXISTS "variantId" TEXT;` },
    { table: "Order",        column: "variantLabel", sql: `ALTER TABLE "Order"     ADD COLUMN IF NOT EXISTS "variantLabel" TEXT;` },
  ];

  for (const { table, column, sql } of colChecks) {
    const [{ exists }] = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${table} AND column_name = ${column}
      ) AS exists;
    `;
    if (!exists) {
      try {
        await prisma.$executeRawUnsafe(sql);
        console.log(`[auto-migrate] ✅ Added ${table}.${column}`);
      } catch (err) {
        console.error(`[auto-migrate] ❌ ${table}.${column}: ${err.message}`);
      }
    }
  }
};
