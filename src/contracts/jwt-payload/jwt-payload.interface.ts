export interface JwtPayload {
  sub: string;
  exp: number;
  jti: string;
  iat: number;
}
