import { Request } from 'express';

export interface UserJwtRequestType extends Request {
  user?: {
    id: number;
    nickname: string;
  };
}
