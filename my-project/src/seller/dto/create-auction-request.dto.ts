import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumberString,
  IsString,
} from 'class-validator';

export class CreateAuctionRequestDto {
  @IsNumberString()
  startPrice!: string; // decimal as string
  
  @IsNotEmpty()
  categoryId!: string; // BigInt as string from frontend

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsDateString()
  endsAt!: string;

  @IsArray()
  @ArrayMinSize(1)
  photoPaths!: string[];
}
