import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { SuspendUserDto } from './dto/suspend-user.dto';
import { ReviewReportDto } from './dto/review-report.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/auth/types/jwt-payload.type';
import { UserRole, ReportStatus } from '@prisma/client';

@Controller('admin')
export class AdminAuthController {
  constructor(private readonly admin: AdminService) {}

  @Public()
  @Post('auth/login')
  login(@Body() dto: AdminLoginDto) {
    return this.admin.login(dto);
  }
}

@Controller('admin')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminApiController {
  constructor(private readonly admin: AdminService) {}

  @Get('users')
  users(@Query('search') search?: string, @Query('skip') skip?: string) {
    return this.admin.listUsers(
      search,
      skip ? parseInt(skip, 10) : 0,
      50,
    );
  }

  @Get('users/ghin-queue')
  ghinQueue(@Query('skip') skip?: string) {
    return this.admin.listGhinQueue(skip ? parseInt(skip, 10) : 0, 50);
  }

  @Get('users/:id')
  user(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.getUser(id);
  }

  @Patch('users/:id')
  updateUser(
    @CurrentUser() admin: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminUserDto,
  ) {
    return this.admin.updateUser(admin.sub, id, dto);
  }

  @Patch('users/:id/suspend')
  suspend(
    @CurrentUser() admin: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuspendUserDto,
  ) {
    return this.admin.suspend(admin.sub, id, dto);
  }

  @Patch('users/:id/ban')
  ban(
    @CurrentUser() admin: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuspendUserDto,
  ) {
    return this.admin.ban(admin.sub, id, dto);
  }

  @Patch('users/:id/restore')
  restore(
    @CurrentUser() admin: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.admin.restore(admin.sub, id);
  }

  @Patch('users/:id/role')
  updateUserRole(
    @CurrentUser() admin: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.admin.updateUserRole(admin.sub, id, dto.role);
  }

  @Patch('users/:id/delete')
  deleteUser(
    @CurrentUser() admin: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.admin.softDeleteUser(admin.sub, id);
  }

  @Patch('users/:id/verify-ghin')
  verifyGhin(
    @CurrentUser() admin: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.admin.verifyGhin(admin.sub, id);
  }

  @Get('reports')
  reports(@Query('status') status?: ReportStatus) {
    return this.admin.listReports(status);
  }

  @Patch('reports/:id/review')
  reviewReport(
    @CurrentUser() admin: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewReportDto,
  ) {
    return this.admin.reviewReport(admin.sub, id, dto);
  }

  @Get('subscriptions')
  subscriptions() {
    return this.admin.listSubscriptions();
  }

  @Get('audit-logs')
  auditLogs(@Query('skip') skip?: string) {
    return this.admin.auditLogs(skip ? parseInt(skip, 10) : 0, 100);
  }

  @Get('dashboard/stats')
  stats() {
    return this.admin.dashboardStats();
  }

  @Get('settings')
  settings() {
    return this.admin.getAppSettings();
  }

  @Patch('settings/:key')
  patchSetting(
    @Param('key') key: string,
    @Body() body: { value: unknown },
  ) {
    return this.admin.patchAppSetting(key, body.value);
  }
}
