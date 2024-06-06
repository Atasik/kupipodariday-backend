import { BadRequestException, Injectable } from '@nestjs/common';
import { Offer } from './entities/offer.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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
    private dataSource: DataSource,
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Wish)
    private readonly wishRepo: Repository<Wish>,
  ) {}

  async create(input: CreateOfferDto, userId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { itemId, amount } = input;
      if (amount <= 0) throw new BadRequestException(errZeroNegativeValue);

      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
      });

      const wish = await queryRunner.manager.findOne(Wish, {
        where: { id: itemId },
        relations: ['owner'],
      });

      if (!wish) throw new BadRequestException(errWishNotExists);
      if (wish.owner.id === user.id)
        throw new BadRequestException(errYourOwnWish);

      wish.raised += amount;
      if (wish.raised > wish.price) throw new BadRequestException(errCupPrice);

      await queryRunner.manager.save(wish);

      const offer = this.offerRepo.create({ ...input, user, item: wish });
      await queryRunner.manager.save(offer);

      await queryRunner.commitTransaction();
      return offer;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
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
