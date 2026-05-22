import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import type WebSocket from 'ws';
import { randomUUID } from 'node:crypto';
import { BbunWsClient } from './websocket.client';
import { WsBaseDto } from './dto/ws-base.dto';
import { WsAuthorizationReqDto } from './dto/ws-authorization.dto';

@Injectable()
export class WebsocketService {
  private readonly AUTHORIZATION_TIMEOUT_MS = 30 * 1000;

  private readonly clients = new Map<WebSocket, BbunWsClient>();
  private readonly roomClients = new Map<string, Set<BbunWsClient>>();

  addClient(wsClient: WebSocket) {
    const client = new BbunWsClient(wsClient);
    this.clients.set(wsClient, client);

    this.sendAuthorizationRequest(client);
  }

  deleteClient(wsClient: WebSocket) {
    const client = this.clients.get(wsClient);

    if (client) {
      this.leaveRoom(client);
    }

    this.clients.delete(wsClient);
  }

  getClientOrThrow(wsClient: WebSocket) {
    const client = this.clients.get(wsClient);

    if (!client) {
      throw new WsException('Client not found');
    }

    return client;
  }

  checkIfValidClient(wsClient: WebSocket): {
    client: BbunWsClient;
    needAuthorization: boolean;
  } {
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

  authorizeClient(
    client: BbunWsClient,
    params: {
      userUuid: string;
      userName: string;
      studentNumber: string;
      profileImageUrl: string | null;
      roomUuid: string;
      lineKey: string;
      accessToken: string;
      validUntil: Date;
    },
  ) {
    this.leaveRoom(client);

    client.setAuthorized(params);

    this.joinRoom(client, params.roomUuid);
  }

  sendAuthorizationRequest(client: BbunWsClient) {
    const authorizationUntil = new Date(
      Date.now() + this.AUTHORIZATION_TIMEOUT_MS,
    );

    client.setNeedAuthorizationUntil(authorizationUntil);

    client.sendMessage(
      {
        type: 'request_authorization',
        request_id: randomUUID(),
        body: {
          authorization_until: authorizationUntil,
        } satisfies WsAuthorizationReqDto,
      },
      true,
    );

    setTimeout(() => {
      if (!client.getIsAuthorized()) {
        client.destroy();
      }
    }, this.AUTHORIZATION_TIMEOUT_MS + 5000);
  }

  broadcastToRoom(
    roomUuid: string,
    message: WsBaseDto<any>,
    options?: {
      excludeUserUuids?: string[];
    },
  ) {
    const roomSet = this.roomClients.get(roomUuid);
    if (!roomSet) return;

    const excludeUserUuidSet = new Set(options?.excludeUserUuids ?? []);

    for (const receiver of roomSet) {
      if (!receiver.getIsAuthorized()) continue;

      const receiverUuid = receiver.getUserUuid();

      if (excludeUserUuidSet.has(receiverUuid)) {
        continue;
      }

      receiver.sendMessage(message);
    }
  }

  private joinRoom(client: BbunWsClient, roomUuid: string) {
    const roomSet = this.roomClients.get(roomUuid) ?? new Set<BbunWsClient>();

    roomSet.add(client);

    this.roomClients.set(roomUuid, roomSet);
  }

  private leaveRoom(client: BbunWsClient) {
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
