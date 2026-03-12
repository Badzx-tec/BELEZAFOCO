import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards
} from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthService } from "../auth/auth.service";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import type { AuthenticatedRequest } from "../auth/auth.types";
import {
  applyAuthCookies,
  extractRequestMetadata
} from "../auth/auth.utils";
import { IsString } from "class-validator";

class SelectWorkspaceDto {
  @IsString()
  workspaceId!: string;
}

@Controller("me")
export class MeController {
  constructor(private readonly authService: AuthService) {}

  @Get("session")
  async session(@Req() request: Request) {
    return (
      (await this.authService.tryGetSessionState(request)) ?? {
        authenticated: false,
        csrfToken: null,
        session: null,
        user: null,
        workspace: null,
        workspaces: []
      }
    );
  }

  @UseGuards(SessionAuthGuard)
  @Post("workspaces/select")
  async selectWorkspace(
    @Body() body: SelectWorkspaceDto,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response
  ) {
    const auth = request.auth;
    if (!auth) {
      return {
        authenticated: false,
        csrfToken: null,
        session: null,
        user: null,
        workspace: null,
        workspaces: []
      };
    }

    const result = await this.authService.selectWorkspace(
      auth,
      body.workspaceId,
      extractRequestMetadata(request)
    );

    applyAuthCookies(response, result.cookies);
    return result.response;
  }
}
