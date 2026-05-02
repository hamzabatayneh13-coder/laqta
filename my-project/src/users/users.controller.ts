import { Controller, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // POST /api/users/become-seller
  @Post("become-seller")
  @UseGuards(JwtAuthGuard)
  async becomeSeller(@Req() req: any) {
    const userId = req.user?.sub; // because your JwtStrategy returns payload (sub exists)
    return this.usersService.becomeSeller(userId);
  }
}
