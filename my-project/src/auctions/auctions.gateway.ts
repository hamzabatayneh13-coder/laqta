import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class AuctionsGateway {
  @WebSocketServer()
  server!: Server;

  // join auction room (for live bid updates)
  @SubscribeMessage('auction:join')
  joinAuction(
    @MessageBody() body: { auctionId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    socket.join(`auction:${body.auctionId}`);
    return { ok: true };
  }

  // ✅ join personal user room (for outbid notifications)
  @SubscribeMessage('user:join')
  joinUser(
    @MessageBody() body: { userId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    socket.join(`user:${body.userId}`);
    return { ok: true };
  }
}
