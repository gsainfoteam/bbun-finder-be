import type WebSocket from 'ws';
import { WsException } from '@nestjs/websockets';
import { WsBaseDto } from './dto/ws-base.dto';
import { sendWsBaseDtoToClient } from './websocket.utils';

export class BbunWsClient {
  private readonly wsClient: WebSocket;

  private isAuthorized = false;
  private needAuthorizationUntil: Date | null = null;

  private userUuid: string | null = null;
  private userName: string | null = null;
  private studentNumber: string | null = null;
  private profileImageUrl: string | null = null;

  private roomUuid: string | null = null;
  private lineKey: string | null = null;

  private accessToken: string | null = null;
  private validUntil: Date | null = null;

  private sentMessageMap = new Map<string, WsBaseDto<any>>();
  private queuedTasks: (() => Promise<any>)[] = [];

  constructor(wsClient: WebSocket) {
    this.wsClient = wsClient;
  }

  getWsClient() {
    return this.wsClient;
  }

  getIsAuthorized() {
    return this.isAuthorized;
  }

  getUserUuid(): string {
    if (!this.userUuid) throw new WsException('User not authorized');
    return this.userUuid;
  }

  getUserName(): string {
    if (!this.userName) throw new WsException('User not authorized');
    return this.userName;
  }

  getRoomUuid(): string {
    if (!this.roomUuid) throw new WsException('Room not joined');
    return this.roomUuid;
  }

  getProfileImageUrl(): string | null {
    return this.profileImageUrl;
  }

  getLineKey(): string {
    if (!this.lineKey) throw new WsException('Room not joined');
    return this.lineKey;
  }

  isValidAccessToken() {
    if (!this.validUntil) return false;
    return new Date() < this.validUntil;
  }

  setNeedAuthorizationUntil(authorizationUntil: Date) {
    this.isAuthorized = false;
    this.needAuthorizationUntil = authorizationUntil;
    this.accessToken = null;
    this.validUntil = null;
  }

  setAuthorized(params: {
    userUuid: string;
    userName: string;
    studentNumber: string;
    profileImageUrl: string | null;
    roomUuid: string;
    lineKey: string;
    accessToken: string;
    validUntil: Date;
  }) {
    if (
      this.needAuthorizationUntil &&
      new Date() > this.needAuthorizationUntil
    ) {
      throw new WsException('Authorization process expired');
    }

    this.isAuthorized = true;
    this.userUuid = params.userUuid;
    this.userName = params.userName;
    this.studentNumber = params.studentNumber;
    this.profileImageUrl = params.profileImageUrl;
    this.roomUuid = params.roomUuid;
    this.lineKey = params.lineKey;
    this.accessToken = params.accessToken;
    this.validUntil = params.validUntil;
    this.needAuthorizationUntil = null;
  }

  sendMessage(message: WsBaseDto<any>, trackRequest = false) {
    if (trackRequest) {
      this.sentMessageMap.set(message.request_id, message);
    }

    sendWsBaseDtoToClient(this.wsClient, message);
  }

  addTaskToQueue<T>(task: () => Promise<T>) {
    this.queuedTasks.push(task);
  }

  async waitForAllTasks() {
    const tasks = [...this.queuedTasks];
    this.queuedTasks = [];

    for (const task of tasks) {
      await task();
    }
  }

  resolveRequestId(requestId: string, type: string) {
    const pendingReq = this.sentMessageMap.get(requestId);

    if (!pendingReq || pendingReq.type !== type) {
      this.sentMessageMap.delete(requestId);
      throw new WsException('Unknown message');
    }

    this.sentMessageMap.delete(requestId);
  }

  destroy() {
    this.wsClient.close();
    this.sentMessageMap.clear();
    this.queuedTasks = [];
  }
}
