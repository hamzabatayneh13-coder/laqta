import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminDecision, AuctionStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async pauseAuction(auctionId: bigint, adminId: bigint) {
    const auction: any = await this.prisma.auction.findUnique({
      where: { id: auctionId as any },
    });

    if (!auction) throw new NotFoundException('Auction not found');

    if (auction.status !== AuctionStatus.LIVE) {
      throw new BadRequestException('Only LIVE auctions can be paused');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.auction.update({
        where: { id: auctionId as any },
        data: {
          status: AuctionStatus.PAUSED,
          pausedAt: new Date(),
        } as any,
      });

      await tx.auctionReview.create({
        data: {
          auctionId: auctionId as any,
          adminId: adminId as any,
          decision: AdminDecision.REQUEST_CHANGES,
          reason: 'Paused by admin',
        } as any,
      });

      return {
        message: 'Auction paused',
        auctionId: updated.id.toString(),
        status: updated.status,
      };
    });
  }

  async resumeAuction(auctionId: bigint, adminId: bigint) {
    const auction: any = await this.prisma.auction.findUnique({
      where: { id: auctionId as any },
    });

    if (!auction) throw new NotFoundException('Auction not found');

    if (auction.status !== AuctionStatus.PAUSED) {
      throw new BadRequestException('Only PAUSED auctions can be resumed');
    }

    if (!auction.pausedAt) {
      throw new BadRequestException('Auction is PAUSED but pausedAt is missing');
    }

    const now = new Date();
    const pausedMs = now.getTime() - new Date(auction.pausedAt).getTime();
    if (pausedMs < 0) throw new BadRequestException('Invalid pausedAt timestamp');

    const oldEndsAt = new Date(auction.endsAt);
    const newEndsAt = new Date(oldEndsAt.getTime() + pausedMs);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.auction.update({
        where: { id: auctionId as any },
        data: {
          status: AuctionStatus.LIVE,
          endsAt: newEndsAt,
          pausedAt: null,
          totalPausedMs: BigInt((auction.totalPausedMs ?? 0).toString()) + BigInt(pausedMs),
        } as any,
      });

      await tx.auctionReview.create({
        data: {
          auctionId: auctionId as any,
          adminId: adminId as any,
          decision: AdminDecision.REQUEST_CHANGES,
          reason: 'Resumed by admin',
        } as any,
      });

      return {
        message: 'Auction resumed',
        auctionId: updated.id.toString(),
        status: updated.status,
        endsAt: updated.endsAt,
      };
    });
  }

  async closeAuction(auctionId: bigint, adminId: bigint, reason?: string) {
    const auction: any = await this.prisma.auction.findUnique({
      where: { id: auctionId as any },
    });

    if (!auction) throw new NotFoundException('Auction not found');

    if (![AuctionStatus.LIVE, AuctionStatus.PAUSED, AuctionStatus.SCHEDULED].includes(auction.status)) {
      throw new BadRequestException('Only LIVE/PAUSED/SCHEDULED auctions can be closed');
    }

    const finalReason =
      reason && reason.trim().length > 0 ? `Closed by admin: ${reason.trim()}` : 'Closed by admin';

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.auction.update({
        where: { id: auctionId as any },
        data: {
          status: AuctionStatus.CANCELLED,
          endsAt: new Date(),
          pausedAt: null,
        } as any,
      });

      await tx.auctionReview.create({
        data: {
          auctionId: auctionId as any,
          adminId: adminId as any,
          decision: AdminDecision.REJECT,
          reason: finalReason,
        } as any,
      });

      return {
        message: 'Auction cancelled',
        auctionId: updated.id.toString(),
        status: updated.status,
      };
    });
  }

  // ── Stats ──────────────────────────────────────────────
  async getStats() {
    const [users, auctions, bids, pendingKyc] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.auction.count(),
      this.prisma.bid.count(),
      this.prisma.sellerProfile.count({ where: { kycStatus: 'PENDING' } as any }),
    ]);

    const buyers = await this.prisma.user.count({ where: { role: 'BUYER' } as any });
    const sellers = await this.prisma.user.count({ where: { role: 'SELLER' } as any });
    const liveAuctions = await this.prisma.auction.count({ where: { status: 'LIVE' } as any });

    return { users, buyers, sellers, auctions, liveAuctions, bids, pendingKyc };
  }

  // ── Users ──────────────────────────────────────────────
  async listUsers() {
    const users: any[] = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: { select: { bids: true } },
      },
    });

    return users.map((u) => ({
      id: u.id.toString(),
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      role: u.role,
      createdAt: u.createdAt,
      totalBids: u._count?.bids ?? 0,
    }));
  }

  async getUser(userId: string) {
    const id = BigInt(userId);

    const user: any = await this.prisma.user.findUnique({
      where: { id: id as any },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const bids: any[] = await this.prisma.bid.findMany({
      where: { userId: id as any },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        amount: true,
        createdAt: true,
        auction: {
          select: {
            id: true,
            status: true,
            endsAt: true,
            currentPrice: true,
            currentWinnerUserId: true,
            listing: { select: { title: true } },
          },
        },
      },
    });

    const formattedBids = bids.map((b) => ({
      id: b.id.toString(),
      amount: b.amount.toString(),
      createdAt: b.createdAt,
      auction: {
        id: b.auction.id.toString(),
        title: b.auction.listing?.title ?? `Auction #${b.auction.id}`,
        status: b.auction.status,
        endsAt: b.auction.endsAt,
        currentPrice: b.auction.currentPrice?.toString(),
        isWinner: b.auction.currentWinnerUserId?.toString() === userId,
      },
    }));

    let sellerProfile: any = null;
    if (user.role === 'SELLER' || user.role === 'ADMIN') {
      const sp: any = await this.prisma.sellerProfile.findUnique({
        where: { userId: id as any },
      });

      if (sp) {
        sellerProfile = {
          id: sp.id.toString(),
          companyName: sp.companyName,
          kycStatus: sp.kycStatus,
          allowsCod: sp.allowsCod,
        };
      }
    }

    return {
      id: user.id.toString(),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
      bids: formattedBids,
      wonAuctions: formattedBids.filter((b) => b.auction.isWinner),
      sellerProfile,
    };
  }

  // ── KYC ────────────────────────────────────────────────
  async listPendingKyc() {
    const profiles: any[] = await this.prisma.sellerProfile.findMany({
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' } as any,
    });

    return profiles.map((p) => ({
      id: p.id.toString(),
      userId: p.userId.toString(),
      companyName: p.companyName ?? '—',
      kycStatus: p.kycStatus ?? 'PENDING',
      allowsCod: p.allowsCod ?? false,
      createdAt: p.createdAt,
      user: {
        id: p.user?.id?.toString(),
        fullName: p.user?.fullName ?? '—',
        email: p.user?.email ?? '—',
        phone: p.user?.phone ?? '—',
      },
    }));
  }

  async approveKyc(profileId: string) {
    const profile: any = await this.prisma.sellerProfile.findUnique({
      where: { id: BigInt(profileId) as any },
    });
    if (!profile) throw new NotFoundException('Seller profile not found');

    await this.prisma.sellerProfile.update({
      where: { id: BigInt(profileId) as any },
      data: { kycStatus: 'APPROVED' } as any,
    });

    const user: any = await this.prisma.user.findUnique({
      where: { id: profile.userId },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      await this.prisma.user.update({
        where: { id: profile.userId },
        data: { role: 'SELLER' } as any,
      });
    }

    return { message: 'Seller approved.' };
  }

  async rejectKyc(profileId: string) {
    const profile: any = await this.prisma.sellerProfile.findUnique({
      where: { id: BigInt(profileId) as any },
    });
    if (!profile) throw new NotFoundException('Seller profile not found');

    await this.prisma.sellerProfile.update({
      where: { id: BigInt(profileId) as any },
      data: { kycStatus: 'REJECTED' } as any,
    });

    const user: any = await this.prisma.user.findUnique({
      where: { id: profile.userId },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      await this.prisma.user.update({
        where: { id: profile.userId },
        data: { role: 'BUYER' } as any,
      });
    }

    return { message: 'Seller rejected.' };
  }

  // ── Auctions review workflow ───────────────────────────
  async listAllAuctions(status?: string) {
    const auctions: any[] = await this.prisma.auction.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: 'desc' } as any,
      include: {
        listing: { include: { category: true, media: true } },
        reviews: { orderBy: { createdAt: 'desc' }, take: 5 },
        _count: { select: { bids: true } },
      },
      take: 200,
    });

    return auctions.map((a) => ({
      id: a.id.toString(),
      status: a.status,
      currentPrice: a.currentPrice?.toString(),
      startsAt: a.startsAt,
      endsAt: a.endsAt,
      createdAt: a.createdAt,
      bidsCount: a._count?.bids ?? 0,
      listing: {
        id: a.listingId.toString(),
        title: a.listing?.title ?? '—',
        description: a.listing?.description ?? null,
        location: a.listing?.location ?? '—',
        category: a.listing?.category?.nameEn ?? '—',
        media: (a.listing?.media || []).map((m: any) => ({
          id: m.id.toString(),
          filePath: m.filePath,
        })),
      },
      lastReview: a.reviews?.[0]
        ? {
            decision: a.reviews[0].decision,
            reason: a.reviews[0].reason,
            createdAt: a.reviews[0].createdAt,
          }
        : null,
    }));
  }

  async getAuction(auctionId: bigint) {
    const a: any = await this.prisma.auction.findUnique({
      where: { id: auctionId as any },
      include: {
        listing: { include: { category: true, media: true } },
        seller: {
          select: { id: true, fullName: true, email: true, phone: true, role: true, createdAt: true },
        },
        bids: {
          orderBy: { createdAt: 'desc' },
          take: 200,
          include: {
            user: { select: { id: true, fullName: true, email: true, phone: true, role: true } },
          },
        },
        reviews: { orderBy: { createdAt: 'desc' } },
        _count: { select: { bids: true } },
      },
    });

    if (!a) throw new NotFoundException('Auction not found');

    const sp: any = await this.prisma.sellerProfile.findUnique({
      where: { userId: a.sellerId as any },
      select: { id: true, companyName: true, kycStatus: true, allowsCod: true, createdAt: true },
    });

    const winner: any = a.currentWinnerUserId
      ? await this.prisma.user.findUnique({
          where: { id: a.currentWinnerUserId as any },
          select: { id: true, fullName: true, email: true, phone: true, role: true, createdAt: true },
        })
      : null;

    return {
      id: a.id.toString(),
      status: a.status,
      startsAt: a.startsAt,
      endsAt: a.endsAt,
      createdAt: a.createdAt,

      pausedAt: a.pausedAt,
      totalPausedMs: a.totalPausedMs?.toString?.() ?? String(a.totalPausedMs ?? 0),

      startPrice: a.startPrice?.toString?.() ?? String(a.startPrice ?? 0),
      bidStep: a.bidStep?.toString?.() ?? String(a.bidStep ?? 1),

      // ✅ NEW: auction minBid saved by admin (nullable)
      minBid: a.minBid?.toString?.() ?? (a.minBid == null ? null : String(a.minBid)),

      currentPrice: a.currentPrice?.toString?.() ?? String(a.currentPrice ?? 0),

      reservePrice: a.reservePrice?.toString?.() ?? (a.reservePrice == null ? null : String(a.reservePrice)),
      reserveMode: a.reserveMode,

      antiSnipingEnabled: a.antiSnipingEnabled,
      antiSnipingLastSeconds: a.antiSnipingLastSeconds,
      antiSnipingExtendSeconds: a.antiSnipingExtendSeconds,

      currentWinnerUserId: a.currentWinnerUserId?.toString?.() ?? null,

      winner: winner
        ? {
            id: winner.id.toString(),
            fullName: winner.fullName,
            email: winner.email,
            phone: winner.phone,
            role: winner.role,
            createdAt: winner.createdAt,
          }
        : null,

      bidsCount: a._count?.bids ?? 0,

      seller: a.seller
        ? {
            id: a.seller.id.toString(),
            fullName: a.seller.fullName,
            email: a.seller.email,
            phone: a.seller.phone,
            role: a.seller.role,
            createdAt: a.seller.createdAt,
            sellerProfile: sp
              ? {
                  id: sp.id.toString(),
                  companyName: sp.companyName,
                  kycStatus: sp.kycStatus,
                  allowsCod: sp.allowsCod,
                  createdAt: sp.createdAt,
                }
              : null,
          }
        : null,

      listing: {
        id: a.listingId.toString(),
        title: a.listing?.title ?? '—',
        description: a.listing?.description ?? null,
        location: a.listing?.location ?? '—',

        // keep existing string
        category: a.listing?.category?.nameEn ?? '—',

        // ✅ NEW: provide categoryObj so frontend can read defaultMinBid
        categoryObj: a.listing?.category
          ? {
              id: a.listing.category.id.toString(),
              nameEn: a.listing.category.nameEn,
              nameAr: a.listing.category.nameAr,
              defaultMinBid:
                a.listing.category.defaultMinBid?.toString?.() ??
                String(a.listing.category.defaultMinBid ?? 1),
            }
          : null,

        media: (a.listing?.media || []).map((m: any) => ({
          id: m.id.toString(),
          filePath: m.filePath,
          createdAt: m.createdAt,
        })),
      },

      bids: (a.bids || []).map((b: any) => ({
        id: b.id.toString(),
        amount: b.amount?.toString?.() ?? String(b.amount),
        createdAt: b.createdAt,
        user: b.user
          ? {
              id: b.user.id.toString(),
              fullName: b.user.fullName,
              email: b.user.email,
              phone: b.user.phone,
              role: b.user.role,
            }
          : null,
      })),

      reviews: (a.reviews || []).map((r: any) => ({
        id: r.id.toString(),
        decision: r.decision,
        reason: r.reason,
        newDescription: r.newDescription,
        adminId: r.adminId.toString(),
        createdAt: r.createdAt,
      })),
    };
  }

  // ✅ UPDATED: approve now accepts minBid (editable) and defaults from category if not provided
  async approveAuction(
    auctionId: bigint,
    adminId: bigint,
    bidStep: number,
    minBid?: number,
    reason?: string,
  ) {
    const auction: any = await this.prisma.auction.findUnique({
      where: { id: auctionId as any },
      include: { listing: { include: { category: true } } },
    });

    if (!auction) throw new NotFoundException('Auction not found');

    if (![AuctionStatus.PENDING_REVIEW, AuctionStatus.NEEDS_CHANGES].includes(auction.status)) {
      throw new BadRequestException('Auction is not pending review / needs changes');
    }

    if (!Number.isFinite(bidStep) || bidStep <= 0) {
      throw new BadRequestException('bidStep must be a number greater than 0');
    }

    if (minBid != null) {
      if (!Number.isFinite(minBid) || minBid < 0) {
        throw new BadRequestException('minBid must be a valid number (>= 0)');
      }
    }

    const defaultMinBid =
      auction?.listing?.category?.defaultMinBid != null ? Number(auction.listing.category.defaultMinBid) : 0;

    const finalMinBid = minBid != null ? minBid : defaultMinBid;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.auction.update({
        where: { id: auctionId as any },
        data: {
          status: AuctionStatus.SCHEDULED,
          bidStep: bidStep,
          minBid: finalMinBid, // ✅ NEW
        } as any,
      });

      await tx.auctionReview.create({
        data: {
          auctionId: auctionId as any,
          adminId: adminId as any,
          decision: AdminDecision.APPROVE,
          reason: reason || null,
        } as any,
      });

      return {
        message: 'Auction approved',
        auctionId: updated.id.toString(),
        status: updated.status,
        bidStep: (updated as any).bidStep,
        minBid: (updated as any).minBid,
      };
    });
  }

  async requestChangesAuction(auctionId: bigint, adminId: bigint, reason: string, newDescription?: string) {
    const auction: any = await this.prisma.auction.findUnique({
      where: { id: auctionId as any },
      include: { listing: true },
    });

    if (!auction) throw new NotFoundException('Auction not found');

    if (![AuctionStatus.PENDING_REVIEW, AuctionStatus.NEEDS_CHANGES].includes(auction.status)) {
      throw new BadRequestException('Auction is not pending review / needs changes');
    }

    return this.prisma.$transaction(async (tx) => {
      if (newDescription && newDescription.trim().length > 0) {
        await tx.listing.update({
          where: { id: auction.listingId as any },
          data: { description: newDescription } as any,
        });
      }

      const updated = await tx.auction.update({
        where: { id: auctionId as any },
        data: { status: AuctionStatus.NEEDS_CHANGES } as any,
      });

      await tx.auctionReview.create({
        data: {
          auctionId: auctionId as any,
          adminId: adminId as any,
          decision: AdminDecision.REQUEST_CHANGES,
          reason,
          newDescription: newDescription || null,
        } as any,
      });

      return {
        message: 'Changes requested',
        auctionId: updated.id.toString(),
        status: updated.status,
      };
    });
  }

  async rejectAuction(auctionId: bigint, adminId: bigint, reason: string) {
    const auction: any = await this.prisma.auction.findUnique({
      where: { id: auctionId as any },
    });

    if (!auction) throw new NotFoundException('Auction not found');

    if (![AuctionStatus.PENDING_REVIEW, AuctionStatus.NEEDS_CHANGES].includes(auction.status)) {
      throw new BadRequestException('Auction is not pending review / needs changes');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.auction.update({
        where: { id: auctionId as any },
        data: { status: AuctionStatus.CANCELLED } as any,
      });

      await tx.auctionReview.create({
        data: {
          auctionId: auctionId as any,
          adminId: adminId as any,
          decision: AdminDecision.REJECT,
          reason,
        } as any,
      });

      return {
        message: 'Auction rejected',
        auctionId: updated.id.toString(),
        status: updated.status,
      };
    });
  }
}
