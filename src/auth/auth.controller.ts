import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Auth')
@ApiBearerAuth('access-token')
@Controller({ path: 'auth', version: '1' })
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Iniciar sesión', description: 'Autentica al usuario y devuelve tokens JWT. Limitado a 5 intentos por minuto.' })
  @ApiResponse({ status: 200, description: 'Login exitoso. Retorna access_token y refresh_token.' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas.' })
  @ApiResponse({ status: 429, description: 'Demasiados intentos. Espera 1 minuto.' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '';
    const userAgent = req.headers['user-agent'] || '';
    return this.authService.login(dto, ipAddress, userAgent);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar tokens', description: 'Genera un nuevo par de tokens usando el refresh token.' })
  @ApiResponse({ status: 200, description: 'Tokens renovados.' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido o expirado.' })
  async refreshTokens(@Body() dto: RefreshTokenDto) {
    const payload = JSON.parse(
      Buffer.from(dto.refreshToken.split('.')[1], 'base64').toString(),
    );
    return this.authService.refreshTokens(payload.sub, payload.sessionId, dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar sesión actual', description: 'Revoca la sesión actual del usuario autenticado.' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada correctamente.' })
  async logout(@CurrentUser() user: any) {
    await this.authService.logout(user.id, user.sessionId);
    return { message: 'Sesión cerrada correctamente' };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar todas las sesiones', description: 'Revoca todas las sesiones activas del usuario.' })
  @ApiResponse({ status: 200, description: 'Todas las sesiones cerradas.' })
  async logoutAll(@CurrentUser() user: any) {
    await this.authService.logoutAll(user.id);
    return { message: 'Todas las sesiones cerradas' };
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Listar sesiones activas', description: 'Retorna todas las sesiones activas del usuario autenticado.' })
  @ApiResponse({ status: 200, description: 'Lista de sesiones activas.' })
  async getSessions(@CurrentUser() user: any) {
    return this.authService.getSessions(user.id);
  }

  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revocar sesión específica' })
  @ApiParam({ name: 'sessionId', description: 'UUID de la sesión a revocar' })
  @ApiResponse({ status: 200, description: 'Sesión revocada.' })
  @ApiResponse({ status: 404, description: 'Sesión no encontrada.' })
  async revokeSession(
    @CurrentUser() user: any,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    await this.authService.revokeSession(user.id, sessionId);
    return { message: 'Sesión revocada' };
  }

  @Get('me')
  @ApiOperation({ summary: 'Obtener perfil propio', description: 'Retorna los datos del usuario actualmente autenticado.' })
  @ApiResponse({ status: 200, description: 'Datos del usuario autenticado.' })
  getMe(@CurrentUser() user: any) {
    return user;
  }
}
