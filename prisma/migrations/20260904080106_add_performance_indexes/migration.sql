-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE INDEX "collections_defaultTypeId_idx" ON "collections"("defaultTypeId");

-- CreateIndex
CREATE INDEX "collections_userId_isFavorite_updatedAt_idx" ON "collections"("userId", "isFavorite", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "collections_userId_updatedAt_idx" ON "collections"("userId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "item_collections_collectionId_idx" ON "item_collections"("collectionId");

-- CreateIndex
CREATE INDEX "items_userId_isPinned_createdAt_idx" ON "items"("userId", "isPinned", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "items_userId_isFavorite_idx" ON "items"("userId", "isFavorite");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");
