import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { Prisma } from 'generated/prisma/client';

//수정해야 됨 무조건
export const GetUser = createParamDecorator(
  (_data, ctx: ExecutionContext): Prisma.UserModel | undefined => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.user as Prisma.UserModel | undefined;
  },
);
