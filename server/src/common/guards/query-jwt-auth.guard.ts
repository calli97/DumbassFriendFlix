import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Uses the 'query-jwt' strategy — accepts token from header OR ?token= query param
@Injectable()
export class QueryJwtAuthGuard extends AuthGuard('query-jwt') {}
