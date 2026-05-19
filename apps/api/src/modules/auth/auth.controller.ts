import { Inject, Controller, Post, Body, Get, Req, UseGuards, Query, HttpException, HttpStatus, Patch, Logger } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RedisService } from "../../redis/redis.service";
import { Public } from "./decorators";
import { JwtAuthGuard } from "./guards";
import type { Request } from "express";

@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private redis: RedisService;
  private authService: AuthService;
  constructor(
    @Inject(AuthService) authService: AuthService,
    @Inject('REDIS_SERVICE') redis: RedisService,
  ) {
    this.authService = authService;
    this.redis = redis;
    this.logger.log(`Initialized: redis=${!!redis}, authService=${!!authService}`);
  }

  private validatePassword(password: string) {
    if (password.length < 8) return false;
    // Removed strict checks for dev convenience, can be re-enabled later
    return true;
  }

  private async checkRateLimit(ip: string, action: string, limit: number, windowMs: number) {
    try {
      const key = `auth_limit:${action}:${ip}`;
      const client = this.redis.getClient();
      
      const count = await client.incr(key);
      if (count === 1) {
        await client.expire(key, Math.floor(windowMs / 1000));
      }
      
      if (count > limit) {
        throw new HttpException(
          { success: false, error: "RATE_LIMIT_EXCEEDED" }, 
          HttpStatus.TOO_MANY_REQUESTS
        );
      }
    } catch (e: any) {
      if (e instanceof HttpException) throw e;
      console.warn(`⚠️ Redis Rate Limit Error: ${e.message}. Continuing...`);
      // Fail open: allow request if Redis is down
    }
  }

  @Public()
  @Post("signup")
  async signup(@Body() body: { email: string; password: string; name: string }, @Req() req: Request) {
    const ipAddress = (req.ip || req.headers["x-forwarded-for"] || "unknown") as string;
    await this.checkRateLimit(ipAddress, "signup", 3, 60 * 60 * 1000); // 3 attempts per hour

    if (!body.email || !body.email.includes("@")) {
      throw new HttpException({ success: false, error: "INVALID_EMAIL" }, HttpStatus.BAD_REQUEST);
    }
    if (!body.password || !this.validatePassword(body.password)) {
      throw new HttpException({ success: false, error: "WEAK_PASSWORD" }, HttpStatus.BAD_REQUEST);
    }
    if (!body.name || body.name.length < 2) {
      throw new HttpException({ success: false, error: "INVALID_NAME" }, HttpStatus.BAD_REQUEST);
    }

    try {
      const result = await this.authService.signup(body.email, body.password, body.name);
      if (result.user && "passwordHash" in result.user) {
        delete (result.user as any).passwordHash;
      }
      return { success: true, data: result };
    } catch (e: any) {
      console.error(`[Signup Controller] Error:`, e);
      throw new HttpException({ success: false, error: e.message || "SIGNUP_FAILED" }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Public()
  @Post("login")
  async login(@Body() body: { email: string; password: string }, @Req() req: Request) {
    const ipAddress = (req.ip || req.headers["x-forwarded-for"] || "unknown") as string;
    await this.checkRateLimit(ipAddress, "login", 5, 15 * 60 * 1000); // 5 attempts per 15 min

    if (!body.email || !body.password) {
      throw new HttpException({ success: false, error: "INVALID_CREDENTIALS" }, HttpStatus.BAD_REQUEST);
    }

    try {
      const result = await this.authService.login(body.email, body.password, ipAddress);
      // Clear password from user response
      if (result.user && "passwordHash" in result.user) {
        delete (result.user as any).passwordHash;
      }
      return { success: true, data: result };
    } catch (e: any) {
      console.error(`[Login Controller] Error:`, e);
      throw new HttpException({ success: false, error: e.message || "LOGIN_FAILED" }, HttpStatus.UNAUTHORIZED);
    }
  }

  @Public()
  @Post("superadmin/login")
  async superadminLogin(@Body() body: { email: string; password: string }, @Req() req: Request) {
    const ipAddress = (req.ip || req.headers["x-forwarded-for"] || "unknown") as string;
    await this.checkRateLimit(ipAddress, "superadmin_login", 5, 15 * 60 * 1000);

    if (!body.email || !body.password) {
      throw new HttpException({ success: false, error: "INVALID_CREDENTIALS" }, HttpStatus.BAD_REQUEST);
    }

    try {
      const result = await this.authService.superadminLogin(body.email, body.password, ipAddress);
      if (result.user && "passwordHash" in result.user) {
        delete (result.user as any).passwordHash;
      }
      return { success: true, data: result };
    } catch (e: any) {
      console.error(`[SuperAdmin Login Controller] Error:`, e);
      throw new HttpException({ success: false, error: e.message || "LOGIN_FAILED" }, HttpStatus.UNAUTHORIZED);
    }
  }

  @Public()
  @Post("refresh")
  async refresh(@Body() body: { refreshToken: string }) {
    if (!body.refreshToken) {
      throw new HttpException({ success: false, error: "MISSING_TOKEN" }, HttpStatus.BAD_REQUEST);
    }
    try {
      const result = await this.authService.refreshToken(body.refreshToken);
      return { success: true, data: result };
    } catch (e: any) {
      throw new HttpException({ success: false, error: "UNAUTHORIZED" }, HttpStatus.UNAUTHORIZED);
    }
  }

  @Public()
  @Post("forgot-password")
  async forgotPassword(@Body() body: { email: string }) {
    if (!body.email) {
      throw new HttpException({ success: false, error: "INVALID_EMAIL" }, HttpStatus.BAD_REQUEST);
    }
    await this.authService.forgotPassword(body.email);
    return { success: true, data: { message: "If the email exists, a reset link has been sent" } };
  }

  @Public()
  @Post("reset-password")
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    if (!body.token || !body.newPassword || !this.validatePassword(body.newPassword)) {
      throw new HttpException({ success: false, error: "INVALID_INPUT" }, HttpStatus.BAD_REQUEST);
    }
    try {
      await this.authService.resetPassword(body.token, body.newPassword);
      return { success: true, data: { message: "Password reset successfully" } };
    } catch (e: any) {
      throw new HttpException({ success: false, error: "BAD_REQUEST" }, HttpStatus.BAD_REQUEST);
    }
  }

  @Public()
  @Get("verify-email")
  async verifyEmail(@Query("token") token: string) {
    if (!token) {
      throw new HttpException({ success: false, error: "MISSING_TOKEN" }, HttpStatus.BAD_REQUEST);
    }
    try {
      await this.authService.verifyEmail(token);
      return { success: true, data: { message: "Email verified successfully" } };
    } catch (e: any) {
      throw new HttpException({ success: false, error: "BAD_REQUEST" }, HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  async logout(@Body() body: { refreshToken: string }) {
    if (!body.refreshToken) {
      throw new HttpException({ success: false, error: "MISSING_TOKEN" }, HttpStatus.BAD_REQUEST);
    }
    await this.authService.logout(body.refreshToken);
    return { success: true, data: { message: "Logged out" } };
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async getMe(@Req() req: Request) {
    const user = (req as any).user;
    if (user && "passwordHash" in user) {
      delete (user as any).passwordHash;
    }
    return { success: true, data: user };
  }

  @UseGuards(JwtAuthGuard)
  @Patch("profile")
  async updateProfile(@Req() req: Request, @Body() body: { name: string }) {
    const user = (req as any).user;
    try {
      const updatedUser = await this.authService.updateProfile(user.id, body.name);
      if ("passwordHash" in updatedUser) delete (updatedUser as any).passwordHash;
      return { success: true, data: updatedUser };
    } catch (e: any) {
      throw new HttpException({ success: false, error: e.message || "UPDATE_FAILED" }, HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post("change-password")
  async changePassword(@Req() req: Request, @Body() body: { currentPassword?: string; newPassword?: string }) {
    const user = (req as any).user;
    if (!body.currentPassword || !body.newPassword) {
      throw new HttpException({ success: false, error: "MISSING_FIELDS" }, HttpStatus.BAD_REQUEST);
    }
    if (!this.validatePassword(body.newPassword)) {
      throw new HttpException({ success: false, error: "WEAK_PASSWORD" }, HttpStatus.BAD_REQUEST);
    }
    try {
      await this.authService.changePassword(user.id, body.currentPassword, body.newPassword);
      return { success: true, data: { message: "Password updated successfully" } };
    } catch (e: any) {
      throw new HttpException({ success: false, error: e.message || "PASSWORD_CHANGE_FAILED" }, HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post("avatar")
  async uploadAvatar(@Req() req: Request, @Body() body: { avatar?: string }) {
    const user = (req as any).user;
    if (!body.avatar) {
      throw new HttpException({ success: false, error: "MISSING_AVATAR_DATA" }, HttpStatus.BAD_REQUEST);
    }

    // Accept base64 data URL (data:image/png;base64,...) or raw base64
    const base64Data = body.avatar.includes(",") ? body.avatar.split(",")[1] : body.avatar;
    const mimeMatch = body.avatar.match(/data:([^;]+);/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const ext = mimeType.split("/")[1] || "jpg";
    const fileName = `avatars/${user.id}-${Date.now()}.${ext}`;

    try {
      // Upload to S3-compatible storage (MinIO) via HTTP PUT
      const s3Endpoint = process.env.S3_ENDPOINT || "http://localhost:9000";
      const bucket = process.env.S3_BUCKET || "whatsapp-saas";
      const buffer = Buffer.from(base64Data, "base64");
      const uploadUrl = `${s3Endpoint}/${bucket}/${fileName}`;

      const accessKey = process.env.S3_ACCESS_KEY || "minioadmin";
      const secretKey = process.env.S3_SECRET_KEY || "minioadmin";
      const auth = Buffer.from(`${accessKey}:${secretKey}`).toString("base64");

      const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": mimeType,
          "Authorization": `Basic ${auth}`,
          "Content-Length": String(buffer.length),
        },
        body: buffer,
      });

      if (res.ok) {
        await this.authService.updateAvatar(user.id, uploadUrl);
        return { success: true, data: { url: uploadUrl } };
      }

      // If S3 upload fails, fall through to DB storage
      throw new Error("S3 upload returned " + res.status);
    } catch {
      // Fallback: store the avatar data URL directly in the database
      try {
        await this.authService.updateAvatar(user.id, body.avatar);
        return { success: true, data: { url: body.avatar } };
      } catch {
        throw new HttpException({ success: false, error: "AVATAR_UPLOAD_FAILED" }, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }
}
