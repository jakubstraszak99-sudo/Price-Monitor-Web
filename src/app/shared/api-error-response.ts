import { ExceptionCode } from './exception-code';

export interface ApiErrorResponse {
  code: ExceptionCode;
  message: string;
  timestamp: string;
}
