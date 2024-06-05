import {
  IsUrl,
  Length,
  IsString,
  IsNumber,
  Min,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';

export class CreateWishDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 250)
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl()
  link: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl()
  image: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  price: number;

  @IsString()
  @Length(1, 1024)
  @IsOptional()
  description: string;
}
