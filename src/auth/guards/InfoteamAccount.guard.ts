import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class InfoteamAccountGuard extends AuthGuard('infoteam-account') {}
