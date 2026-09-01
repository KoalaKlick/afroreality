-- Add gallery_images array to Event table
ALTER TABLE "events" ADD COLUMN "gallery_images" TEXT[] NOT NULL DEFAULT '{}';

-- Create index for gallery_images queries
CREATE INDEX "idx_events_gallery_images" ON "events" USING GIN ("gallery_images");
