import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuctionStatus, ListingStatus } from '@prisma/client';
import { CreateAuctionRequestDto } from './dto/create-auction-request.dto';

@Injectable()
export class SellerService {
  constructor(private prisma: PrismaService) {}

  async apply(userId: string, body: any) {
    const id = BigInt(userId);

    if (!body.businessName?.trim()) {
      throw new BadRequestException('Business name is required.');
    }

    // check if already applied
    const existing = await this.prisma.sellerProfile.findUnique({
      where: { userId: id as any },
    });

    if (existing) {
      throw new BadRequestException('You have already submitted a seller application.');
    }

    // ✅ IMPORTANT: do not downgrade ADMIN role to SELLER
    const user: any = await this.prisma.user.findUnique({
      where: { id: id as any },
      select: { id: true, role: true },
    });

    if (!user) throw new BadRequestException('User not found');

    if (user.role !== 'ADMIN') {
      // update user role to SELLER (only if not admin)
      await this.prisma.user.update({
        where: { id: id as any },
        data: { role: 'SELLER' } as any,
      });
    }

    const profile = await this.prisma.sellerProfile.create({
      data: {
        userId: id as any,
        companyName: body.businessName,
        allowsCod: false,
      } as any,
    });

    return {
      message: 'Application submitted. Pending admin review.',
      profileId: profile.id.toString(),
    };
  }

  async getMyProfile(userId: string) {
    const id = BigInt(userId);

    const profile: any = await this.prisma.sellerProfile.findUnique({
      where: { userId: id as any },
    });

    if (!profile) return {};

    return {
      id: profile.id.toString(),
      businessName: profile.companyName ?? null,
      businessType: profile.businessType ?? null,
      kycStatus: profile.kycStatus ?? 'PENDING',
      codAllowed: profile.allowsCod ?? false,
    };
  }

  async createAuctionRequest(userId: string, dto: CreateAuctionRequestDto) {
    const sellerId = BigInt(userId);

    const user: any = await this.prisma.user.findUnique({
      where: { id: sellerId as any },
      select: { id: true, role: true },
    });

    if (!user) throw new BadRequestException('User not found');

    // ✅ Allow ADMIN to use seller functionality too
    if (user.role !== 'SELLER' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Seller access only');
    }

    const startsAt = new Date();
    const endsAt = new Date(dto.endsAt);

    if (Number.isNaN(endsAt.getTime())) {
      throw new BadRequestException('Invalid endsAt date');
    }

    if (endsAt.getTime() <= startsAt.getTime()) {
      throw new BadRequestException('endsAt must be in the future');
    }

    // validate startPrice
    const startPriceNum = Number(dto.startPrice);
    if (!Number.isFinite(startPriceNum) || startPriceNum < 0) {
      throw new BadRequestException('Invalid startPrice');
    }

    // validate category exists
    const categoryId = BigInt(dto.categoryId);
    const cat = await this.prisma.category.findUnique({
      where: { id: categoryId as any },
      select: { id: true },
    });
    if (!cat) throw new BadRequestException('Invalid categoryId');

    return this.prisma.$transaction(async (tx) => {
      const listing = await tx.listing.create({
        data: {
          sellerId: sellerId as any,
          categoryId: categoryId as any,
          title: dto.title,
          description: dto.description,
          status: ListingStatus.PENDING_REVIEW,
          media: {
            create: dto.photoPaths.map((p) => ({ filePath: p })),
          },
        } as any,
      });

      const auction = await tx.auction.create({
        data: {
          listingId: listing.id as any,
          sellerId: sellerId as any,
          status: AuctionStatus.PENDING_REVIEW,
          startsAt,
          endsAt,

          // save seller start price and set currentPrice to start price
          startPrice: startPriceNum as any,
          currentPrice: startPriceNum as any,
        } as any,
        include: {
          listing: { include: { media: true, category: true } },
        },
      });

      return auction;
    });
  }

  async listMyAuctions(userId: string) {
    const sellerId = BigInt(userId);

    const auctions = await this.prisma.auction.findMany({
      where: { sellerId: sellerId as any },
      orderBy: { createdAt: 'desc' } as any,
      include: {
        listing: { include: { category: true, media: true } },
        reviews: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      take: 100,
    });

    return auctions.map((a: any) => ({
      id: a.id.toString(),
      status: a.status,
      endsAt: a.endsAt,
      createdAt: a.createdAt,
      listing: {
        title: a.listing?.title ?? '—',
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

  async resubmitAuction(userId: string, auctionId: string) {
    const sellerId = BigInt(userId);
    const aId = BigInt(auctionId);

    // Load auction + listing for ownership + status checks
    const auction: any = await this.prisma.auction.findUnique({
      where: { id: aId as any },
      select: {
        id: true,
        sellerId: true,
        status: true,
        listingId: true,
      },
    });

    if (!auction) throw new BadRequestException('Auction not found');

    // Only the owner can resubmit
    if (auction.sellerId !== (sellerId as any)) {
      throw new ForbiddenException('Not your auction');
    }

    // Only allow resubmit from NEEDS_CHANGES
    if (auction.status !== AuctionStatus.NEEDS_CHANGES) {
      throw new BadRequestException('Only NEEDS_CHANGES auctions can be resubmitted');
    }

    // Move back to pending review (auction + listing)
    await this.prisma.$transaction(async (tx) => {
      await tx.auction.update({
        where: { id: aId as any },
        data: { status: AuctionStatus.PENDING_REVIEW } as any,
      });

      await tx.listing.update({
        where: { id: auction.listingId as any },
        data: { status: ListingStatus.PENDING_REVIEW } as any,
      });

      // Optional: audit log
      // await tx.auditLog.create({
      //   data: {
      //     adminId: sellerId as any, // not really admin; you may want a different schema for seller logs
      //     action: "SELLER_RESUBMIT_AUCTION",
      //     entity: "Auction",
      //     entityId: auctionId,
      //     metaJson: JSON.stringify({ from: "NEEDS_CHANGES", to: "PENDING_REVIEW" }),
      //   } as any,
      // });
    });

    return { message: 'Resubmitted successfully. Pending admin review.' };
  }


  async getMyAuction(userId: string, auctionId: string) {
    const sellerId = BigInt(userId);
    const aId = BigInt(auctionId);

    const a: any = await this.prisma.auction.findUnique({
      where: { id: aId as any },
      include: {
        listing: { include: { category: true, media: true } },
        reviews: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!a) throw new BadRequestException('Auction not found');
    if (a.sellerId !== (sellerId as any)) throw new ForbiddenException('Not your auction');

    return {
      id: a.id.toString(),
      status: a.status,
      endsAt: a.endsAt,
      startPrice: a.startPrice?.toString?.() ?? String(a.startPrice ?? 0),
      listing: {
        id: a.listing?.id?.toString?.() ?? String(a.listingId),
        title: a.listing?.title ?? '—',
        description: a.listing?.description ?? null,
        categoryId: a.listing?.categoryId?.toString?.() ?? String(a.listing?.categoryId ?? ''),
        category: a.listing?.category
          ? {
              id: a.listing.category.id.toString(),
              nameEn: a.listing.category.nameEn,
              nameAr: a.listing.category.nameAr,
            }
          : null,
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
    };
  }

  async updateMyAuction(userId: string, auctionId: string, body: any) {
    const sellerId = BigInt(userId);
    const aId = BigInt(auctionId);

    const a: any = await this.prisma.auction.findUnique({
      where: { id: aId as any },
      select: { id: true, sellerId: true, status: true, listingId: true },
    });

    if (!a) throw new BadRequestException('Auction not found');
    if (a.sellerId !== (sellerId as any)) throw new ForbiddenException('Not your auction');

    // Allow editing in these states (adjust if you want stricter)
    const allowed = ['NEEDS_CHANGES', 'PENDING_REVIEW', 'DRAFT'];
    if (!allowed.includes(a.status)) {
      throw new BadRequestException(`Cannot edit auction while status is ${a.status}`);
    }

    // Validate endsAt if provided
    let endsAt: Date | undefined = undefined;
    if (body.endsAt) {
      endsAt = new Date(body.endsAt);
      if (Number.isNaN(endsAt.getTime())) throw new BadRequestException('Invalid endsAt date');
      if (endsAt.getTime() <= Date.now()) throw new BadRequestException('endsAt must be in the future');
    }

    // Validate startPrice if provided
    let startPriceNum: number | undefined = undefined;
    if (body.startPrice != null) {
      startPriceNum = Number(body.startPrice);
      if (!Number.isFinite(startPriceNum) || startPriceNum < 0) {
        throw new BadRequestException('Invalid startPrice');
      }
    }

    // Validate categoryId if provided
    let categoryId: bigint | undefined = undefined;
    if (body.categoryId) {
      categoryId = BigInt(body.categoryId);
      const cat = await this.prisma.category.findUnique({
        where: { id: categoryId as any },
        select: { id: true },
      });
      if (!cat) throw new BadRequestException('Invalid categoryId');
    }

    const title = body.title?.trim?.();
    const description = body.description?.trim?.();
    if (body.title != null && !title) throw new BadRequestException('Title is required');
    if (body.description != null && !description) throw new BadRequestException('Description is required');

    const photoPaths: string[] = Array.isArray(body.photoPaths) ? body.photoPaths : [];

    await this.prisma.$transaction(async (tx) => {
      // Update auction fields
      await tx.auction.update({
        where: { id: aId as any },
        data: {
          ...(endsAt ? { endsAt } : {}),
          ...(startPriceNum != null ? { startPrice: startPriceNum as any } : {}),
        } as any,
      });

      // Update listing fields
      await tx.listing.update({
        where: { id: a.listingId as any },
        data: {
          ...(categoryId ? { categoryId: categoryId as any } : {}),
          ...(body.title != null ? { title } : {}),
          ...(body.description != null ? { description } : {}),
        } as any,
      });

      // Append photos (create new media rows)
      if (photoPaths.length) {
        await tx.listingMedia.createMany({
          data: photoPaths.map((p) => ({
            listingId: a.listingId as any,
            filePath: p,
          })),
        });
      }
    });

    // return fresh
    return this.getMyAuction(userId, auctionId);
  }

  async deleteAuctionMedia(userId: string, auctionId: string, mediaId: string) {
    const sellerId = BigInt(userId);
    const aId = BigInt(auctionId);
    const mId = BigInt(mediaId);

    const a: any = await this.prisma.auction.findUnique({
      where: { id: aId as any },
      select: { id: true, sellerId: true, status: true, listingId: true },
    });

    if (!a) throw new BadRequestException('Auction not found');
    if (a.sellerId !== (sellerId as any)) throw new ForbiddenException('Not your auction');

    const allowed = ['NEEDS_CHANGES', 'PENDING_REVIEW', 'DRAFT'];
    if (!allowed.includes(a.status)) {
      throw new BadRequestException(`Cannot delete photos while status is ${a.status}`);
    }

    // Ensure the media belongs to this listing
    const media: any = await this.prisma.listingMedia.findUnique({
      where: { id: mId as any },
      select: { id: true, listingId: true },
    });

    if (!media) throw new BadRequestException('Media not found');
    if (media.listingId !== a.listingId) throw new ForbiddenException('Media does not belong to this auction');

    await this.prisma.listingMedia.delete({
      where: { id: mId as any },
    });

    return { message: 'Deleted' };
  }


}
