[comment 1]
src/chat/chat.service.ts
senderUuid: message.senderUuid,
senderName: message.sender.name,
profileImageUrl: message.sender.profileImageUrl,
message: isDeleted ? '메시지가 삭제되었습니다.' : (message.content ?? ''),
Member
@BranKein
BranKein
3 days ago
soft delete 때 message.content 에 '메세지가 삭제되었습니다.' 로 저장하지 않고 null 로 저장하는 이유가 따로 있을까요?

---

[comment 2] src/chat/chat.repository.ts
.catch((err: unknown) =>
this.handlePrismaError('blockUser', err, {
foreignKeyMessage: 'Blocker user or blocked user does not exist',
conflictMessage: 'User block already exists',
Member
@BranKein
BranKein
3 days ago
•
에러를 보낼 필요는 없지 않을까요?

---

[comemnt 3] src/chat/chat.repository.ts
if (err instanceof Prisma.PrismaClientKnownRequestError) {
if (err.code === 'P2025') {
this.logger.error(`${methodName} Error`);
this.logger.debug(err);
Member
@BranKein
BranKein
3 days ago
•
logger.error, logger.debug 는 if 문 위에서 한번에 처리하고 throw 할때만 if 문 해도 될듯해요. (코드가 안이뻐요)

---

[comment 4] src/websocket/dto/ws-base.dto.ts
@@ -0,0 +1,129 @@
export class WsBaseDto<TBody = unknown, TType extends string = string> {
Member
@BranKein
BranKein
3 days ago
아래에 보니 type 필드의 type 이 주석처리되었던데, 이러면 TType 의미가 사라집니다. 없어져도 될 것 같네요

---

[comment 5]
src/websocket/websocket.gateway.ts
);
}

@SubscribeMessage('block_user')
Member
@BranKein
BranKein
3 days ago
block/unblock user 가 rest api 로 있는데 ws 로 뚫려있는 이유? 다른 사용자에게 관련 정보가 넘어가는것도 없기에 클라이언트 단에서는 (앱? 웹?) rest api 만 사용하게 하면 될 것 같은데 ws 로도 해당 기능이 있는 이유는 뭔가요?

---

[comment 6]
prisma/migrations/20260521141609_add_chat/migration.sql
"uuid" UUID NOT NULL,
"room_uuid" UUID NOT NULL,
"sender_uuid" UUID NOT NULL,
"content" TEXT,
Member
@BranKein
BranKein
3 days ago
psql + migration 구조라 뒤늦게 바꾸는건 의미가 없지만,, TEXT 타입은 테이블의 맨 뒤로, 마지막 컬럼으로 놓는 것이 좋습니다. 일반적인 테이블의 컬럼 순서는, PK, FK들, 컬럼 타입의 크기가 작은 순 으로, TEXT 와 같은 unbound type 은 맨 뒤로 가는것이 좋습니다.

---

[comment 7] Comment thread
prisma/schema.prisma
roomUuid String @map("room_uuid") @db.Uuid
senderUuid String @map("sender_uuid") @db.Uuid

content String?
Member
@BranKein
BranKein
3 days ago
WsSendChatReqDto 에 message 길이가 314 로 되어있던데, TEXT 로 안하고 varchar 로 해도 되지 않았을까요?

---

[comment 8] Comment thread
src/chat/dto/ws-send-chat.dto.ts
export class WsSendChatReqDto {
@IsString()
@IsNotEmpty()
@MaxLength(314)
Member
@BranKein
BranKein
3 days ago
314는 어디서 나온 숫자..? db 에 varchar 로 수정하게 되는 경우 255 또는 그 이상의 적당한 숫자 골라서 넣으면 될 것 같아요

---

[comment 9] src/chat/dto/chat-message-response.dto.ts
roomUuid: string;
senderUuid: string;
senderName: string | null;
profileImageUrl: string | null;
Member
@BranKein
BranKein
3 days ago
모든 메세지에 senderName 과 profileImageUrl 이 하나하나 필요하진 않을 듯 합니다. 팟쥐의 경우 해당 팟 자체의 정보를 가져올 때 참여자들의 정보가 한번 넘어가고 채팅에는 해당 채팅을 보낸 참여자의 uuid 만 넘겨집니다. take 의 최대개수가 100개뿐이기에 profileImageUrl 이 있더라도 데이터의 크기가 엄청 커지진 않겠지만 디테일을 챙기고 싶다면 이런 부분에서 챙겨도 좋습니다.
