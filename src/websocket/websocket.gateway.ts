import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import type WebSocket from 'ws';
import { randomUUID } from 'node:crypto';
import { AuthService } from '../auth/auth.service';
import { ChatService } from '../chat/chat.service';
import { WebsocketService } from './websocket.service';
import { WsBaseDto, WsResponseDto } from './dto/ws-base.dto';
import { WsAuthorizationResDto } from './dto/ws-authorization.dto';
import { WsSendChatReqDto } from '../chat/dto/ws-send-chat.dto';
import { WsEditChatReqDto } from '../chat/dto/ws-edit-chat.dto';
import { WsDeleteChatReqDto } from '../chat/dto/ws-delete-chat.dto';
import { WsBlockUserReqDto } from '../chat/dto/ws-block-user.dto';

@WebSocketGateway({ path: '/ws' })
export class WebsocketGateway
  implements OnGatewayConnection<WebSocket>, OnGatewayDisconnect<WebSocket>
{
  constructor(
    private readonly websocketService: WebsocketService,
    private readonly authService: AuthService,
    private readonly chatService: ChatService,
  ) {}

  handleConnection(wsClient: WebSocket) {
    this.websocketService.addClient(wsClient);
  }

  handleDisconnect(wsClient: WebSocket) {
    this.websocketService.deleteClient(wsClient);
  }

  @SubscribeMessage('authorization')
  async authorization(
    @ConnectedSocket() wsClient: WebSocket,
    @MessageBody() payload: WsBaseDto<WsAuthorizationResDto>,
  ) {
    const client = this.websocketService.getClientOrThrow(wsClient);

    if (client.getIsAuthorized()) {
      client.sendMessage(
        WsResponseDto.OK('authorization_res', payload.request_id),
      );
      return;
    }

    client.resolveRequestId(payload.request_id, 'request_authorization');

    const { user, validUntil } = await this.authService.validateWsAccessToken(
      payload.body.authorization,
    );

    const { room, lineKey } = await this.chatService.getOrCreateMyBbunRoom(
      user.uuid,
    );

    this.websocketService.authorizeClient(client, {
      userUuid: user.uuid,
      userName: user.name,
      studentNumber: user.studentNumber,
      profileImageUrl: user.profileImageUrl,
      roomUuid: room.uuid,
      lineKey,
      accessToken: payload.body.authorization,
      validUntil,
    });

    client.sendMessage(
      WsResponseDto.OK('authorization_res', payload.request_id),
    );

    await client.waitForAllTasks();
  }

  @SubscribeMessage('send_chat')
  async sendChat(
    @ConnectedSocket() wsClient: WebSocket,
    @MessageBody() payload: WsBaseDto<WsSendChatReqDto>,
  ) {
    const checked = this.websocketService.checkIfValidClient(wsClient);

    if (checked.needAuthorization) {
      checked.client.addTaskToQueue(() => this.sendChat(wsClient, payload));
      return;
    }

    const client = checked.client;

    const message = await this.chatService.saveChat({
      userUuid: client.getUserUuid(),
      roomUuid: client.getRoomUuid(),
      message: payload.body.message,
    });

    client.sendMessage(WsResponseDto.OK('send_chat_res', payload.request_id));

    const blockedReceiverUuids =
      await this.chatService.getReceiverUuidsBlockingSender(
        client.getUserUuid(),
      );

    this.websocketService.broadcastToRoom(
      client.getRoomUuid(),
      {
        type: 'chat_received',
        request_id: randomUUID(),
        body: this.chatService.toMessageResponse(message),
      },
      {
        excludeUserUuids: blockedReceiverUuids,
      },
    );
  }

  @SubscribeMessage('edit_chat')
  async editChat(
    @ConnectedSocket() wsClient: WebSocket,
    @MessageBody() payload: WsBaseDto<WsEditChatReqDto>,
  ) {
    const checked = this.websocketService.checkIfValidClient(wsClient);

    if (checked.needAuthorization) {
      checked.client.addTaskToQueue(() => this.editChat(wsClient, payload));
      return;
    }

    const client = checked.client;

    const message = await this.chatService.editChat({
      userUuid: client.getUserUuid(),
      messageUuid: payload.body.messageUuid,
      message: payload.body.message,
    });

    client.sendMessage(WsResponseDto.OK('edit_chat_res', payload.request_id));

    const blockedReceiverUuids =
      await this.chatService.getReceiverUuidsBlockingSender(
        client.getUserUuid(),
      );

    this.websocketService.broadcastToRoom(
      client.getRoomUuid(),
      {
        type: 'chat_edited',
        request_id: randomUUID(),
        body: this.chatService.toMessageResponse(message),
      },
      {
        excludeUserUuids: blockedReceiverUuids,
      },
    );
  }

  @SubscribeMessage('delete_chat')
  async deleteChat(
    @ConnectedSocket() wsClient: WebSocket,
    @MessageBody() payload: WsBaseDto<WsDeleteChatReqDto>,
  ) {
    const checked = this.websocketService.checkIfValidClient(wsClient);

    if (checked.needAuthorization) {
      checked.client.addTaskToQueue(() => this.deleteChat(wsClient, payload));
      return;
    }

    const client = checked.client;

    const message = await this.chatService.deleteChat({
      userUuid: client.getUserUuid(),
      messageUuid: payload.body.messageUuid,
    });

    client.sendMessage(WsResponseDto.OK('delete_chat_res', payload.request_id));

    const blockedReceiverUuids =
      await this.chatService.getReceiverUuidsBlockingSender(
        client.getUserUuid(),
      );

    this.websocketService.broadcastToRoom(
      client.getRoomUuid(),
      {
        type: 'chat_deleted',
        request_id: randomUUID(),
        body: this.chatService.toMessageResponse(message),
      },
      {
        excludeUserUuids: blockedReceiverUuids,
      },
    );
  }

  @SubscribeMessage('block_user')
  async blockUser(
    @ConnectedSocket() wsClient: WebSocket,
    @MessageBody() payload: WsBaseDto<WsBlockUserReqDto>,
  ) {
    const checked = this.websocketService.checkIfValidClient(wsClient);

    if (checked.needAuthorization) {
      checked.client.addTaskToQueue(() => this.blockUser(wsClient, payload));
      return;
    }

    const client = checked.client;

    await this.chatService.blockUser({
      blockerUserUuid: client.getUserUuid(),
      blockedUserUuid: payload.body.targetUserUuid,
    });

    client.sendMessage(WsResponseDto.OK('block_user_res', payload.request_id));
  }

  @SubscribeMessage('unblock_user')
  async unblockUser(
    @ConnectedSocket() wsClient: WebSocket,
    @MessageBody() payload: WsBaseDto<WsBlockUserReqDto>,
  ) {
    const checked = this.websocketService.checkIfValidClient(wsClient);

    if (checked.needAuthorization) {
      checked.client.addTaskToQueue(() => this.unblockUser(wsClient, payload));
      return;
    }

    const client = checked.client;

    await this.chatService.unblockUser({
      blockerUserUuid: client.getUserUuid(),
      blockedUserUuid: payload.body.targetUserUuid,
    });

    client.sendMessage(
      WsResponseDto.OK('unblock_user_res', payload.request_id),
    );
  }
}
