import { PartialType } from '@nestjs/mapped-types';
import { CreateTripScheduleChangeDto } from './create-trip-schedule-change.dto.js';

export class UpdateTripScheduleChangeDto extends PartialType(CreateTripScheduleChangeDto) {}
