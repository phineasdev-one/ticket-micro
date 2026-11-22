import { IBase } from './base.interface';

export interface AuthResponse {
  accessToken: string;
}

export interface UserProfileResponse extends IBase {
  name: string;
  role: string;
  email: string;
}

export interface EventResponse extends IBase {
  date: string;
  title: string;
  price: number;
  status: string;
  capacity: number;
  location: string;
  description: string;
  organizerId: string;
}

export interface TicketResponse extends IBase {
  status: string;
  userId: string;
  eventId: string;
  quantity: number;
  ticketCode: string;
}
