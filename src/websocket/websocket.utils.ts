import type WebSocket from 'ws';
import { WsBaseDto } from './dto/ws-base.dto';

type ParsedWsMessage = {
  type: string;
  request_id: string;
  body: unknown;
};

const toRawString = (
  data: string | ArrayBuffer | Buffer | Buffer[],
): string => {
  if (typeof data === 'string') return data;
  if (Array.isArray(data)) return Buffer.concat(data).toString('utf8');
  if (Buffer.isBuffer(data)) return data.toString('utf8');

  return Buffer.from(data).toString('utf8');
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isParsedWsMessage = (value: unknown): value is ParsedWsMessage => {
  if (!isRecord(value)) return false;

  return (
    typeof value.type === 'string' &&
    typeof value.request_id === 'string' &&
    'body' in value
  );
};

export const customMessageParser = (
  data: string | ArrayBuffer | Buffer | Buffer[],
): {
  event: string;
  data: WsBaseDto<unknown>;
} => {
  const parsed: unknown = JSON.parse(toRawString(data));

  if (!isParsedWsMessage(parsed)) {
    throw new Error('Invalid WebSocket message format');
  }

  const wsMessage: WsBaseDto<unknown> = {
    type: parsed.type,
    request_id: parsed.request_id,
    body: parsed.body,
  };

  return {
    event: wsMessage.type,
    data: wsMessage,
  };
};

export const sendWsBaseDtoToClient = <TBody>(
  client: WebSocket,
  data: WsBaseDto<TBody>,
): void => {
  if (client.readyState !== 1) return;
  client.send(JSON.stringify(data));
};
