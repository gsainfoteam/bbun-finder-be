import type WebSocket from 'ws';
import { WsBaseDto } from './dto/ws-base.dto';

const toRawString = (data: string | ArrayBuffer | Buffer | Buffer[]) => {
  if (typeof data === 'string') return data;
  if (Array.isArray(data)) return Buffer.concat(data).toString('utf8');
  if (Buffer.isBuffer(data)) return data.toString('utf8');
  return Buffer.from(data).toString('utf8');
};

export const customMessageParser = (
  data: string | ArrayBuffer | Buffer | Buffer[],
) => {
  const parsed = JSON.parse(toRawString(data));

  const wsMessage: WsBaseDto<any> = {
    type: parsed.type,
    request_id: parsed.request_id,
    body: parsed.body,
  };

  return {
    event: parsed.type,
    data: wsMessage,
  };
};

export const sendWsBaseDtoToClient = (
  client: WebSocket,
  data: WsBaseDto<any>,
) => {
  if (client.readyState !== 1) return;
  client.send(JSON.stringify(data));
};
