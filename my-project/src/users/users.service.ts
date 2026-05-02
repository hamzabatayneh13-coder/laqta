import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async becomeSeller(userIdRaw: string | number) {
    const userId =
      typeof userIdRaw === "string" ? Number(userIdRaw) : userIdRaw;

    if (!userId || Number.isNaN(userId)) {
      throw new BadRequestException("Invalid user id");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) throw new ForbiddenException("User not found");

    // Keep admins as admins
    if (user.role === "ADMIN") return { id: user.id, role: user.role };

    // Already seller
    if (user.role === "SELLER") return { id: user.id, role: user.role };

    // Buyer -> Seller
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role: "SELLER" },
      select: { id: true, role: true },
    });

    return updated;
  }
}
