import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const in60 = new Date(now.getTime() + 60 * 60 * 1000);

    // ✅ liveNow: auctions currently running
    const liveNowPromise = this.prisma.auction.count({
      where: {
        status: "LIVE",
        startsAt: { lte: now },
        endsAt: { gt: now },
      },
    });

    // ✅ endingSoon: live auctions ending within next 60 minutes
    const endingSoonPromise = this.prisma.auction.count({
      where: {
        status: "LIVE",
        endsAt: { gt: now, lte: in60 },
      },
    });

    const [liveNow, endingSoon] = await Promise.all([
      liveNowPromise,
      endingSoonPromise,
    ]);

    return { liveNow, endingSoon };
  }
}
