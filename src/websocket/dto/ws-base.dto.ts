// export class WsBaseDto<T> {
//   type!: string;
//   request_id!: string;
//   body!: T;
// }

// export class WsResponseDto {
//   response_code!: number;
//   result: any;

//   static OK(type: string, requestId: string): WsBaseDto<WsResponseDto> {
//     return {
//       type,
//       request_id: requestId,
//       body: {
//         response_code: 200,
//         result: 'OK',
//       },
//     };
//   }

//   static ERROR(
//     type: string,
//     requestId: string,
//     responseCode: number,
//     result: any,
//   ): WsBaseDto<WsResponseDto> {
//     return {
//       type,
//       request_id: requestId,
//       body: {
//         response_code: responseCode,
//         result,
//       },
//     };
//   }
// }

export type WsRequestType =
  | 'authorization'
  | 'send_chat'
  | 'edit_chat'
  | 'delete_chat'
  | 'block_user'
  | 'unblock_user';

export type WsServerRequestType = 'request_authorization';

export type WsResponseType =
  | 'authorization_res'
  | 'send_chat_res'
  | 'edit_chat_res'
  | 'delete_chat_res'
  | 'block_user_res'
  | 'unblock_user_res';

export type WsBroadcastType = 'chat_received' | 'chat_edited' | 'chat_deleted';

export type WsMessageType =
  | WsRequestType
  | WsServerRequestType
  | WsResponseType
  | WsBroadcastType;

export interface WsBaseDto<TBody, TType extends WsMessageType = WsMessageType> {
  type: TType;
  request_id: string;
  body: TBody;
}

export type WsSuccessResult = 'OK';

export type WsErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'UNKNOWN_MESSAGE'
  | 'MESSAGE_EMPTY'
  | 'MESSAGE_TOO_LONG'
  | 'EDIT_TIME_EXPIRED'
  | 'INTERNAL_SERVER_ERROR';

export interface WsErrorResult {
  error: WsErrorCode;
  message: string;
}

export type WsResponseResult = WsSuccessResult | WsErrorResult;

export class WsResponseDto<
  TResult extends WsResponseResult = WsResponseResult,
> {
  response_code!: number;
  result!: TResult;

  static OK<TType extends WsResponseType>(
    type: TType,
    requestId: string,
  ): WsBaseDto<WsResponseDto<WsSuccessResult>, TType> {
    return {
      type,
      request_id: requestId,
      body: {
        response_code: 200,
        result: 'OK',
      },
    };
  }

  static ERROR<TType extends WsResponseType>(
    type: TType,
    requestId: string,
    responseCode: number,
    result: WsErrorResult,
  ): WsBaseDto<WsResponseDto<WsErrorResult>, TType> {
    return {
      type,
      request_id: requestId,
      body: {
        response_code: responseCode,
        result,
      },
    };
  }
}
