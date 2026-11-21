import { IBase } from './base.interface';

export interface IUser extends IBase {
  name: string;
  email: string;
}

export interface IAuthUser extends Pick<IUser, 'id' | 'email'> {
  roles: string[];
}