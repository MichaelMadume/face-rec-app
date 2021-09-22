export interface JwtPayloadModel {
    sub: string;
    jti: string;
    nbf: number;
    exp: number;
    iss: string;
    aud: string;
}
