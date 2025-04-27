-- CreateTable
CREATE TABLE "RevokedToken" (
    "_id" TEXT NOT NULL,
    "jti" TEXT NOT NULL,

    CONSTRAINT "RevokedToken_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RevokedToken_jti_key" ON "RevokedToken"("jti");
