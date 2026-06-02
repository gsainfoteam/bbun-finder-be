-- CreateEnum
CREATE TYPE "ChatMessageStatus" AS ENUM ('ACTIVE', 'EDITED', 'DELETED');

-- CreateTable
CREATE TABLE "chat_room" (
    "uuid" UUID NOT NULL,
    "line_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_room_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "chat_room_member" (
    "uuid" UUID NOT NULL,
    "room_uuid" UUID NOT NULL,
    "user_uuid" UUID NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),

    CONSTRAINT "chat_room_member_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "chat_message" (
    "uuid" UUID NOT NULL,
    "room_uuid" UUID NOT NULL,
    "sender_uuid" UUID NOT NULL,
    "status" "ChatMessageStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "edited_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "content" VARCHAR(255) NOT NULL,

    CONSTRAINT "chat_message_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "user_block" (
    "uuid" UUID NOT NULL,
    "blocker_user_uuid" UUID NOT NULL,
    "blocked_user_uuid" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_block_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_room_line_key_key" ON "chat_room"("line_key");

-- CreateIndex
CREATE INDEX "chat_room_member_user_uuid_idx" ON "chat_room_member"("user_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "chat_room_member_room_uuid_user_uuid_key" ON "chat_room_member"("room_uuid", "user_uuid");

-- CreateIndex
CREATE INDEX "chat_message_room_uuid_created_at_idx" ON "chat_message"("room_uuid", "created_at");

-- CreateIndex
CREATE INDEX "user_block_blocked_user_uuid_idx" ON "user_block"("blocked_user_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "user_block_blocker_user_uuid_blocked_user_uuid_key" ON "user_block"("blocker_user_uuid", "blocked_user_uuid");

-- AddForeignKey
ALTER TABLE "chat_room_member" ADD CONSTRAINT "chat_room_member_room_uuid_fkey" FOREIGN KEY ("room_uuid") REFERENCES "chat_room"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_room_member" ADD CONSTRAINT "chat_room_member_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "user"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_room_uuid_fkey" FOREIGN KEY ("room_uuid") REFERENCES "chat_room"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_sender_uuid_fkey" FOREIGN KEY ("sender_uuid") REFERENCES "user"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_block" ADD CONSTRAINT "user_block_blocker_user_uuid_fkey" FOREIGN KEY ("blocker_user_uuid") REFERENCES "user"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_block" ADD CONSTRAINT "user_block_blocked_user_uuid_fkey" FOREIGN KEY ("blocked_user_uuid") REFERENCES "user"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
