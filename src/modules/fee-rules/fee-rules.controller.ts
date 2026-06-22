import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { FeeRulesService } from './fee-rules.service';

@Controller('fee-rules')
export class FeeRulesController {
  constructor(private readonly feeRulesService: FeeRulesService) {}

  @Get()
  findAll() {
    return this.feeRulesService.findAll();
  }

  @Get('lookup')
  lookup(@Query('parcelType') parcelType: string, @Query('destinationZone') destinationZone: string) {
    return this.feeRulesService.lookup(parcelType, destinationZone);
  }

  @Post()
  create(@Body() dto: any) {
    return this.feeRulesService.create(dto);
  }
}
