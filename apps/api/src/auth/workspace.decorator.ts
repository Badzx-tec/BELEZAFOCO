import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import type { AuthenticatedRequest } from "./auth.types";

export const WorkspaceId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  const wid = request.auth?.workspaceId;
  if (!wid) throw new UnauthorizedException("No active workspace");
  return wid;
});
