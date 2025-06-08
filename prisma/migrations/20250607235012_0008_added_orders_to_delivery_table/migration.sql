-- CreateEnum
CREATE TYPE "OrdersToDeliveryStatus" AS ENUM ('NEW', 'ARCHIVE');

-- CreateTable
CREATE TABLE "orders_to_delivery" (
    "_id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "status" "OrdersToDeliveryStatus" NOT NULL DEFAULT 'NEW',
    "consignee" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "orders_to_delivery_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_to_delivery_orderNumber_consignee_key" ON "orders_to_delivery"("orderNumber", "consignee");
