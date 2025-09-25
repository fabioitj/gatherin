-- CreateTable
CREATE TABLE "cache_metadata" (
    "key" VARCHAR(50) NOT NULL,
    "value" TEXT,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cache_metadata_pkey" PRIMARY KEY ("key")
);
