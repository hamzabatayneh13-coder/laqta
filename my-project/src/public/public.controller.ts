import { Controller, Get } from "@nestjs/common";
import { PublicService } from "./public.service";

@Controller("public")
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  // GET /public/stats
  @Get("stats")
  getStats() {
    return this.publicService.getStats();
  }
}
