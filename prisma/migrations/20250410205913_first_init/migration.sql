-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PAUSED', 'REGISTRATION', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "IndividualCodeStatus" AS ENUM ('NEW', 'USED');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('PLANNED', 'INPROGRESS', 'PAUSED', 'DONE', 'CANCELED');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "gtin" VARCHAR(14) NOT NULL,
    "alcohol_code" VARCHAR(19) NOT NULL,
    "expiration_in_days" INTEGER NOT NULL,
    "volume" DECIMAL(65,30) NOT NULL,
    "pictureUrl" VARCHAR(1024),
    "status" "ProductStatus" NOT NULL DEFAULT 'INACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndividualCode" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "productId" TEXT NOT NULL,
    "status" "IndividualCodeStatus" NOT NULL DEFAULT 'NEW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "boxesCodeId" INTEGER,
    "shiftId" TEXT,

    CONSTRAINT "IndividualCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoxesCode" (
    "id" SERIAL NOT NULL,
    "gln" TEXT NOT NULL,
    "counter" SERIAL NOT NULL,
    "sscc" VARCHAR(22) NOT NULL,
    "productId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "shiftId" TEXT,

    CONSTRAINT "BoxesCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "planned_day" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" TEXT NOT NULL,
    "planned_count" INTEGER,
    "fact_count" INTEGER,
    "packing" BOOLEAN NOT NULL DEFAULT false,
    "countInBox" INTEGER,
    "status" "ShiftStatus" NOT NULL DEFAULT 'PLANNED',
    "operatorId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "barcode" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "Operator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(80) NOT NULL,
    "first_name" VARCHAR(80) NOT NULL,
    "last_name" VARCHAR(80) NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_id_key" ON "Product"("id");

-- CreateIndex
CREATE INDEX "Product_gtin_idx" ON "Product"("gtin");

-- CreateIndex
CREATE UNIQUE INDEX "Product_gtin_alcohol_code_key" ON "Product"("gtin", "alcohol_code");

-- CreateIndex
CREATE UNIQUE INDEX "IndividualCode_code_key" ON "IndividualCode"("code");

-- CreateIndex
CREATE INDEX "IndividualCode_code_idx" ON "IndividualCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "BoxesCode_sscc_key" ON "BoxesCode"("sscc");

-- CreateIndex
CREATE INDEX "BoxesCode_sscc_idx" ON "BoxesCode"("sscc");

-- CreateIndex
CREATE UNIQUE INDEX "Shift_id_key" ON "Shift"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Operator_id_key" ON "Operator"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "IndividualCode" ADD CONSTRAINT "IndividualCode_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndividualCode" ADD CONSTRAINT "IndividualCode_boxesCodeId_fkey" FOREIGN KEY ("boxesCodeId") REFERENCES "BoxesCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndividualCode" ADD CONSTRAINT "IndividualCode_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoxesCode" ADD CONSTRAINT "BoxesCode_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoxesCode" ADD CONSTRAINT "BoxesCode_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
