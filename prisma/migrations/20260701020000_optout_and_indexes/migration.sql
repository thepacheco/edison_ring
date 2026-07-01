-- SMS opt-out (STOP/START/HELP compliance) + conversation location index (hardening)

-- CreateTable
CREATE TABLE "OptOut" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OptOut_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OptOut_businessId_idx" ON "OptOut"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "OptOut_businessId_phone_key" ON "OptOut"("businessId", "phone");

-- CreateIndex
CREATE INDEX "Conversation_locationId_idx" ON "Conversation"("locationId");

-- AddForeignKey
ALTER TABLE "OptOut" ADD CONSTRAINT "OptOut_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
