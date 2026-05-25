import type WebSocket from 'ws';
import { WsException } from '@nestjs/websockets';
import { WsBaseDto } from './dto/ws-base.dto';
import { sendWsBaseDtoToClient } from './websocket.utils';

//추가
export type AuthorizeClientParams = {
  userUuid: string;
  userName: string;
  studentNumber: string;
  profileImageUrl: string | null;
  roomUuid: string;
  lineKey: string;
  accessToken: string;
  validUntil: Date;
};

export class BbunWsClient {
  private static readonly MAX_QUEUED_TASKS = 100;
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

  private readonly sentMessageMap = new Map<string, WsBaseDto<unknown>>();
  private queuedTasks: Array<() => Promise<void>> = [];

  constructor(wsClient: WebSocket) {
    this.wsClient = wsClient;
  }

  getWsClient(): WebSocket {
    return this.wsClient;
  }

  getIsAuthorized(): boolean {
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

  getStudentNumber(): string {
    if (!this.studentNumber) throw new WsException('User not authorized');
    return this.studentNumber;
  }

  getProfileImageUrl(): string | null {
    return this.profileImageUrl;
  }

  getRoomUuid(): string {
    if (!this.roomUuid) throw new WsException('Room not joined');
    return this.roomUuid;
  }

  getLineKey(): string {
    if (!this.lineKey) throw new WsException('Room not joined');
    return this.lineKey;
  }

  isValidAccessToken(): boolean {
    if (!this.validUntil) return false;
    return new Date() < this.validUntil;
  }

  setNeedAuthorizationUntil(authorizationUntil: Date): void {
    this.isAuthorized = false;
    this.needAuthorizationUntil = authorizationUntil;
    this.accessToken = null;
    this.validUntil = null;
  }

  setAuthorized(params: AuthorizeClientParams): void {
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

  sendMessage<TBody>(message: WsBaseDto<TBody>, trackRequest = false): void {
    if (trackRequest) {
      this.sentMessageMap.set(message.request_id, message);
    }
    sendWsBaseDtoToClient(this.wsClient, message);
  }

  addTaskToQueue(task: () => Promise<void>): void {
    if (this.queuedTasks.length >= BbunWsClient.MAX_QUEUED_TASKS) {
      throw new WsException('Too many pending requests');
    }
    this.queuedTasks.push(task);
  }

  async waitForAllTasks(): Promise<void> {
    const tasks = [...this.queuedTasks];
    this.queuedTasks = [];
    let firstError: Error | null = null;

    for (const task of tasks) {
      try {
        await task();
      } catch (error) {
        if (!firstError) {
          firstError =
            error instanceof Error ? error : new Error(String(error));
        }
      }
    }
    if (firstError) throw firstError;
  }

  resolveRequestId(requestId: string, type: string): void {
    const pendingReq = this.sentMessageMap.get(requestId);

    if (!pendingReq || pendingReq.type !== type) {
      this.sentMessageMap.delete(requestId);
      throw new WsException('Unknown message');
    }

    this.sentMessageMap.delete(requestId);
  }

  destroy(): void {
    this.wsClient.close();
    this.sentMessageMap.clear();
    this.queuedTasks = [];
  }
}
