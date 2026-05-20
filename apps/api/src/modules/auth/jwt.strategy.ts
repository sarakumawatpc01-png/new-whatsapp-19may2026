import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { getEnv } from "@repo/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const env = getEnv();
    const hasPublicKey = !!env.JWT_PUBLIC_KEY && env.JWT_PUBLIC_KEY.includes("BEGIN PUBLIC KEY");
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: hasPublicKey ? env.JWT_PUBLIC_KEY : (env.JWT_SECRET || "default-secret"),
      algorithms: hasPublicKey ? ["RS256"] : ["HS256"],
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
