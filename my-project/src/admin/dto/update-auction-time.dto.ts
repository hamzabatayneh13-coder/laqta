import { IsDateString, IsNotEmpty } from 'class-validator';

export class UpdateAuctionEndTimeDto {
  @IsDateString()
  @IsNotEmpty()
  endsAt!: string;
}
