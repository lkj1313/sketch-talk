import { Controller, Get } from '@nestjs/common';
import type { ControllerResponse } from '@/common/types/api-response.type';
import { AppService } from '@/app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): ControllerResponse<string> {
    return {
      data: this.appService.getHello(),
    };
  }
}
