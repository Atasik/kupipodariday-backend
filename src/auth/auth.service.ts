import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import config from 'src/config/config';

const errWrongPassword = 'Неправильный пароль';
const errUserNotExtists = 'Пользователь не существует';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UsersService,
  ) {}

  auth(user: User) {
    const payload = { sub: user.id };

    return {
      access_token: this.jwtService.sign(payload, {
        expiresIn: config().jwt.expiresIn,
      }),
    };
  }

  async validate(username: string, password: string) {
    const user = await this.userService.findOneByUsername(username);

    if (user) {
      return bcrypt.compare(password, user.password).then((matched) => {
        if (!matched) {
          throw new ForbiddenException(errWrongPassword);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...result } = user;
        return result;
      });
    }
    throw new NotFoundException(errUserNotExtists);
  }
}
