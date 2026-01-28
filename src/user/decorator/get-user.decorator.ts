import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

//수정해야 됨 무조건
export const GetUser = createParamDecorator(
  (_data, ctx: ExecutionContext): User | undefined => {
    const req = ctx.switchToHttp().getRequest();
    // deprecated
    if (!req.user.ziggle) return req.user;
    return req.user.ziggle;

    // return req.user;
  },
);
