-- CreateEnum
CREATE TYPE "ShopRedeemRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "shop_redeem_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemTitle" TEXT NOT NULL,
    "itemCategory" TEXT NOT NULL,
    "itemBenefit" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "walletBalanceAtRequest" INTEGER NOT NULL,
    "status" "ShopRedeemRequestStatus" NOT NULL DEFAULT 'PENDING',
    "statusReason" TEXT,
    "itemSnapshot" JSONB NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "fulfilledAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_redeem_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shop_redeem_requests_userId_itemId_status_key" ON "shop_redeem_requests"("userId", "itemId", "status");

-- CreateIndex
CREATE INDEX "shop_redeem_requests_userId_status_requestedAt_idx" ON "shop_redeem_requests"("userId", "status", "requestedAt");

-- CreateIndex
CREATE INDEX "shop_redeem_requests_status_requestedAt_idx" ON "shop_redeem_requests"("status", "requestedAt");

-- AddForeignKey
ALTER TABLE "shop_redeem_requests" ADD CONSTRAINT "shop_redeem_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
