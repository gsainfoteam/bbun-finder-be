import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import type WebSocket from 'ws';
import { randomUUID } from 'node:crypto';
import { AuthorizeClientParams, BbunWsClient } from './websocket.client';
import { WsBaseDto } from './dto/ws-base.dto';
import { WsAuthorizationReqDto } from './dto/ws-authorization.dto';

type CheckClientResult = {
  client: BbunWsClient;
  needAuthorization: boolean;
};

type BroadcastOptions = {
  excludeUserUuids?: string[];
};

@Injectable()
export class WebsocketService {
  private readonly AUTHORIZATION_TIMEOUT_MS = 30 * 1000;

  private readonly clients = new Map<WebSocket, BbunWsClient>();
  private readonly roomClients = new Map<string, Set<BbunWsClient>>();

  addClient(wsClient: WebSocket): void {
    const client = new BbunWsClient(wsClient);

    this.clients.set(wsClient, client);
    this.sendAuthorizationRequest(client);
  }

  deleteClient(wsClient: WebSocket): void {
    const client = this.clients.get(wsClient);

    if (client) {
      this.leaveRoom(client);
    }

    this.clients.delete(wsClient);
  }

  getClientOrThrow(wsClient: WebSocket): BbunWsClient {
    const client = this.clients.get(wsClient);

    if (!client) {
      throw new WsException('Client not found');
    }

    return client;
  }

  checkIfValidClient(wsClient: WebSocket): CheckClientResult {
    const client = this.getClientOrThrow(wsClient);

    if (!client.getIsAuthorized()) {
      return {
        client,
        needAuthorization: true,
      };
    }

    if (!client.isValidAccessToken()) {
      this.sendAuthorizationRequest(client);

      return {
        client,
        needAuthorization: true,
      };
    }

    return {
      client,
      needAuthorization: false,
    };
  }

  authorizeClient(client: BbunWsClient, params: AuthorizeClientParams): void {
    this.leaveRoom(client);
    client.setAuthorized(params);
    this.joinRoom(client, params.roomUuid);
  }

  sendAuthorizationRequest(client: BbunWsClient) {
    const authorizationUntil = new Date(
      Date.now() + this.AUTHORIZATION_TIMEOUT_MS,
    );

    client.setNeedAuthorizationUntil(authorizationUntil);

    const authorizationReq: WsBaseDto<WsAuthorizationReqDto> = {
      type: 'request_authorization',
      request_id: randomUUID(),
      body: {
        authorization_until: authorizationUntil,
      },
    };

    client.sendMessage(authorizationReq, true);

    setTimeout(() => {
      if (!client.getIsAuthorized()) {
        client.destroy();
      }
    }, this.AUTHORIZATION_TIMEOUT_MS + 5000);
  }

  broadcastToRoom<TBody>(
    roomUuid: string,
    message: WsBaseDto<TBody>,
    options: BroadcastOptions = {},
  ): void {
    const roomSet = this.roomClients.get(roomUuid);
    if (!roomSet) return;

    const excludeUserUuidSet = new Set(options.excludeUserUuids ?? []);

    for (const receiver of roomSet) {
      if (!receiver.getIsAuthorized()) continue;

      const receiverUuid = receiver.getUserUuid();

      if (excludeUserUuidSet.has(receiverUuid)) {
        continue;
      }

      receiver.sendMessage(message);
    }
  }

  private joinRoom(client: BbunWsClient, roomUuid: string): void {
    const roomSet = this.roomClients.get(roomUuid) ?? new Set<BbunWsClient>();

    roomSet.add(client);
    this.roomClients.set(roomUuid, roomSet);
  }

  private leaveRoom(client: BbunWsClient): void {
    let roomUuid: string;

    try {
      roomUuid = client.getRoomUuid();
    } catch {
      return;
    }

    const roomSet = this.roomClients.get(roomUuid);
    if (!roomSet) return;

    roomSet.delete(client);

    if (roomSet.size === 0) {
      this.roomClients.delete(roomUuid);
    }
  }
}
