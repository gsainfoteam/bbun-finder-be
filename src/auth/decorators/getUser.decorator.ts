import { IdTokenPayloadType } from '@lib/infoteam-account';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

//수정해야 됨 무조건
export const GetUser = createParamDecorator(
  (_data, ctx: ExecutionContext): IdTokenPayloadType | undefined => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.user as IdTokenPayloadType;
  },
);
