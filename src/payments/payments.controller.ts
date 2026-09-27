import { Controller, Post, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';
@Controller('payments')
export class PaymentsController {
  constructor(private svc: PaymentsService) {}
  @Post('paypal/create') create(@Body() b: { totalCents: number; currency?: string }) { return this.svc.createPaypalOrder(b.totalCents, b.currency); }
  @Post('paypal/capture') capture(@Body() b: { paypalOrderId: string }) { return this.svc.capturePaypalOrder(b.paypalOrderId); }
  @Post('cod/confirm') cod(@Body() b: { orderId: string }) { return { ok: true, method: 'cod', note: 'Pay cash/card on delivery. Staff confirms by phone.', ...b }; }
}
