-- CreateTable
CREATE TABLE "SettingConfig" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SettingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SettingConfig_key_key" ON "SettingConfig"("key");

-- CreateIndex
CREATE INDEX "SettingConfig_category_idx" ON "SettingConfig"("category");
