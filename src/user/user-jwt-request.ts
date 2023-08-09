import { Request } from 'express';

export interface UserJwtRequest extends Request {
  user?: {
    id: number;
    nickname: string;
  };
}
