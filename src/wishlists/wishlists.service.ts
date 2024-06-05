import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { Wishlist } from './entities/wishlist.entity';
import { Repository } from 'typeorm';
import { Wish } from '../wishes/entities/wish.entity';

const errForbiddenToUpdateWishlist = 'Запрещено изменять чужой список подарков';
const errForbiddenToDeleteWishlist = 'Запрещено удалять чужой список подарков';

@Injectable()
export class WishlistsService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistsRepo: Repository<Wishlist>,
  ) {}

  async findAll() {
    return this.wishlistsRepo.find({ relations: ['items', 'owner'] });
  }

  async create(id: number, input: CreateWishlistDto) {
    const { itemsId, ...upd } = input;
    const wishes = itemsId.map((id: number) => ({ id } as Wish));
    const wishlist = this.wishlistsRepo.create({
      ...upd,
      owner: { id },
      items: wishes,
    });
    return this.wishlistsRepo.save(wishlist);
  }

  async findOne(id: number) {
    return await this.wishlistsRepo.findOne({
      where: { id },
      relations: ['items', 'owner'],
    });
  }

  async updateOne(id: number, input: UpdateWishlistDto, userId: number) {
    const wishlist = await this.wishlistsRepo.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (userId !== wishlist.owner.id) {
      throw new ForbiddenException(errForbiddenToUpdateWishlist);
    }
    const { itemsId, ...upd } = input;
    const items = itemsId.map((id) => ({ id } as Wishlist));
    await this.wishlistsRepo.save({ id, items, ...upd });
    return this.findOne(id);
  }

  async removeOne(id: number, userId: number) {
    const wishlist = await this.wishlistsRepo.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (wishlist.owner.id !== userId) {
      throw new ForbiddenException(errForbiddenToDeleteWishlist);
    }

    this.wishlistsRepo.delete(id);
    return this.findOne(id);
  }
}
