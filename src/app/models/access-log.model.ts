export enum AccessType {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  ACCESS = 'ACCESS',
  VIEW = 'VIEW'
}

export enum AccessStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  BLOCKED = 'BLOCKED'
}

export interface AccessLog {
  id?: number;
  idUsuario?: number;
  username: string;
  email?: string;
  idSistema?: number;
  nombreSistema?: string;
  rol?: string;
  requestMethod?: string;
  requestUrl?: string;
  accessType: AccessType;
  accessStatus: AccessStatus;
  deviceType?: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: string;
  createdAt?: Date;
  updatedAt?: Date;
}