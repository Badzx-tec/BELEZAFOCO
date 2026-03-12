import {
  CanActivate,
  ExecutionContext,
  Injectable
} from "@nestjs/common";
import type { AuthenticatedRequest } from "./auth.types";
import { AuthService } from "./auth.service";

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    request.auth ??= await this.authService.authenticateRequest(request);
    await this.authService.assertRequestCsrf(request.auth, request);
    return true;
  }
}
