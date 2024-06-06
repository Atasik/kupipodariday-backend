import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';

const errExistsCode = '23505';
const errUserExistsMessage =
  'Пользователь с таким никнеймом или почтой уже существует';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async create(input: CreateUserDto) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...user } = input;
    const hash = await bcrypt.hash(password, 10);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...resp } = await this.userRepo.save({
        ...input,
        password: hash,
      });

      return resp;
    } catch (err) {
      if (err instanceof QueryFailedError) {
        if (err.driverError.code === errExistsCode) {
          throw new ConflictException(errUserExistsMessage);
        }
      }
      return err;
    }
  }

  findOne(id: number) {
    return this.userRepo.findOne({ where: { id } });
  }

  async findOneByUsername(username: string) {
    const user = await this.userRepo.findOne({
      select: ['id', 'password', 'username', 'about'],
      where: { username },
    });
    return user;
  }

  async findWishesByUsername(username: string) {
    const user = await this.userRepo.findOne({
      where: {
        username: username,
      },
      relations: ['wishes'],
    });
    return user.wishes;
  }

  async findWishes(id: number) {
    const user = await this.userRepo.findOne({
      where: {
        id: id,
      },
      relations: ['wishes'],
    });
    return user.wishes;
  }

  async updateOne(input: UpdateUserDto, id: number) {
    if (input.password) {
      input.password = await bcrypt.hash(input.password, 10);
    }
    try {
      await this.userRepo.update(id, input);
    } catch (err) {
      if (err instanceof QueryFailedError) {
        if (err.driverError.code === errExistsCode) {
          throw new ConflictException(errUserExistsMessage);
        }
      }
      return err;
    }
    return this.findOne(id);
  }

  findMany(query: string) {
    return this.userRepo.find({
      where: [{ username: query }, { email: query }],
    });
  }
}
