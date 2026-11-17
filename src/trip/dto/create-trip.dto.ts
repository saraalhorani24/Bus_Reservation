export class CreateTripDto {
  source?: string;
  destination?: string;
  busModelId?: string;
  price?: number;
  tripDate?: string;
  tripTime?: string;
  scheduleType?: string;
  status?: string;
  bookedSeatsCount?: number;
}
