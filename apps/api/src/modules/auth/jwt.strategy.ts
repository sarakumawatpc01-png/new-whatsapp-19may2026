import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { getEnv } from "@repo/config";
import { createPublicKey } from "crypto";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const env = getEnv();
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.JWT_SECRET || "default-secret",
    });
  }

  async validate(payload: any) {
    return { 
      id: payload.sub, 
      tenantId: payload.tenant_id, 
      role: payload.role 
    };
  }
}
