import { IsNotEmpty, IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class ApproveAuctionDto {

  // ✅ NEW: Minimum next bid increment (bid step)
  @IsNumber()
  @Min(1)
  bidStep!: number;
  minBid?: number; // ✅ NEW

  @IsString()
  @IsOptional()
  reason?: string;
}

export class RequestChangesAuctionDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsString()
  @IsOptional()
  newDescription?: string;
}

export class RejectAuctionDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
