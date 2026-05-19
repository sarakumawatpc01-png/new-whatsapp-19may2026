import "reflect-metadata";
import { createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenant;
  },
);

export const Roles = (...roles: string[]) => SetMetadata("roles", roles);

export function Public(): MethodDecorator {
  return SetMetadata("isPublic", true) as MethodDecorator;
}
