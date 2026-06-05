export class WsBaseDto<TBody = unknown> {
  type!: string;
  request_id!: string;
  body!: TBody;
}

export class WsResponseDto<TResult = unknown> {
  response_code!: number;
  result!: TResult;

  static OK<TType extends string>(
    type: TType,
    requestId: string,
  ): WsBaseDto<WsResponseDto<'OK'>> {
    return {
      type,
      request_id: requestId,
      body: {
        response_code: 200,
        result: 'OK',
      },
    };
  }

  static ERROR<TType extends string, TResult>(
    type: TType,
    requestId: string,
    responseCode: number,
    result: TResult,
  ): WsBaseDto<WsResponseDto<TResult>> {
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
