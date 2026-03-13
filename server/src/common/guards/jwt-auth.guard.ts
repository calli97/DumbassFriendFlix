import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Thin wrapper around Passport's JWT guard for use across the application
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
