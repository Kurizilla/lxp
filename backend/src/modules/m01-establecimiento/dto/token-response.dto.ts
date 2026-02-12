export class TokenResponseDto {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
}

export class UserResponseDto {
  id: string;
  email: string;
  name?: string;
  role: string;
}

export class AuthResponseDto {
  token: TokenResponseDto;
  user: UserResponseDto;
}
