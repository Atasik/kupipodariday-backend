import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { WishesService } from './wishes.service';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('wishes')
export class WishesController {
  constructor(private readonly wishesService: WishesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Body() createWishDto: CreateWishDto, @Req() req) {
    return this.wishesService.create(createWishDto, req.user.id);
  }

  @Get('last')
  findLastWishes() {
    return this.wishesService.findLast();
  }

  @Get('top')
  findTopWishes() {
    return this.wishesService.findTop();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  findOneWish(@Param('id') id: string) {
    return this.wishesService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  updateOne(
    @Req() req,
    @Param('id') id: string,
    @Body() updateWishDto: UpdateWishDto,
  ) {
    return this.wishesService.updateOne(req.user.id, +id, updateWishDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  removeOne(@Param('id') id: string, @Req() req) {
    return this.wishesService.removeOne(+id, req.user.id);
  }

  @Post(':id/copy')
  @UseGuards(AuthGuard('jwt'))
  copy(@Param('id') id: string, @Req() req) {
    return this.wishesService.copy(+id, req.user.id);
  }
}
