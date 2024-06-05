import { BadRequestException, Injectable } from '@nestjs/common';
import { Offer } from './entities/offer.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Wish } from 'src/wishes/entities/wish.entity';
import { CreateOfferDto } from './dto/create-offer.dto';

const errWishNotExists = 'Подарка не существует';
const errYourOwnWish = 'Нельзя добавлять пожертвования к своему подарку';
const errCupPrice = 'Вы даете больше денег, чем требуется';
const errZeroNegativeValue = 'Введите цену больше нуля';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Wish)
    private readonly wishRepo: Repository<Wish>,
  ) {}

  async create(input: CreateOfferDto, userId: number) {
    const { itemId, amount } = input;
    if (amount <= 0) throw new BadRequestException(errZeroNegativeValue);
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });
    const wish = await this.wishRepo.findOne({
      where: { id: itemId },
      relations: ['owner'],
    });

    if (!wish) throw new BadRequestException(errWishNotExists);
    if (wish.owner.id === user.id)
      throw new BadRequestException(errYourOwnWish);
    wish.raised += amount;
    if (wish.raised > wish.price) throw new BadRequestException(errCupPrice);

    await this.wishRepo.save(wish);

    return this.offerRepo.create({ ...input, user, item: wish });
  }

  findAll() {
    return this.offerRepo.find({
      relations: ['user', 'item'],
    });
  }

  async findOne(id: number) {
    return this.offerRepo.findOne({ where: { id } });
  }
}
