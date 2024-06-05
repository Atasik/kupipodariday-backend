import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Wish } from './entities/wish.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';

const errNoWishFound = 'Подарок не найден';
const errCantChangeWishPrice =
  'Нельзя поменять цену, если деньги уже начали собирать';
const errCantDeleteWish =
  'Нельзя удалять подарок, если деньги уже начали собирать';
const errForbiddenUpdateWish = 'Нельзя обновлять данные чужого подарка';
const errForbiddenDeleteWish = 'Нельзя удалять чужой подарок';

@Injectable()
export class WishesService {
  constructor(
    @InjectRepository(Wish)
    private wishRepo: Repository<Wish>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async create(input: CreateWishDto, id: number) {
    const user = await this.userRepo.findOneBy({ id: id });
    return this.wishRepo.save({
      ...input,
      owner: user,
    });
  }

  findLast() {
    return this.wishRepo.find({
      order: { createdAt: 'DESC' },
      take: 40,
      relations: ['owner', 'offers'],
    });
  }

  findTop() {
    return this.wishRepo.find({
      take: 10,
      order: { copied: 'DESC' },
      relations: ['owner', 'offers'],
    });
  }

  async findOne(id: number) {
    const wish = await this.wishRepo.findOne({
      where: { id },
      relations: ['owner', 'offers', 'offers.user'],
    });
    if (!wish) throw new BadRequestException(errNoWishFound);
    return wish;
  }

  async updateOne(userId: number, wishId: number, input: UpdateWishDto) {
    const wish = await this.findOne(wishId);
    if (userId !== wish.owner.id)
      throw new ForbiddenException(errForbiddenUpdateWish);
    if (wish.raised > 0) throw new BadRequestException(errCantChangeWishPrice);
    await this.wishRepo.update(wishId, input);
  }

  async removeOne(id: number, userId: number) {
    const wish = await this.findOne(id);

    if (userId !== wish.owner.id)
      throw new ForbiddenException(errForbiddenDeleteWish);
    if (wish.raised > 0) throw new BadRequestException(errCantDeleteWish);
    await this.wishRepo.delete(id);
  }

  async copy(wishId: number, user: User) {
    const { id, name, link, image, price, description, copied } =
      await this.findOne(wishId);
    await this.wishRepo.update(id, { copied: copied + 1 });
    return this.wishRepo.save({
      ...{ name, link, image, price, description, owner: user },
    });
  }
}
