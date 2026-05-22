import { INestApplicationContext } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import { customMessageParser } from './websocket.utils';

export class WebsocketAdapter extends WsAdapter {
  constructor(appOrHttpServer?: INestApplicationContext | any) {
    super(appOrHttpServer);
  }

  public messageParser = customMessageParser;
}
