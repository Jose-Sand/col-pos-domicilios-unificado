import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { WebhookProcessor } from './webhook.processor';
import { PlatformAdapterFactory } from './adapters/platform-adapter.factory';
import { RappiAdapter } from './adapters/rappi.adapter';
import { IfoodAdapter } from './adapters/ifood.adapter';
import { DomiciliosAdapter } from './adapters/domicilios.adapter';
import { UberEatsAdapter } from './adapters/uber-eats.adapter';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'orders',
    }),
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    WebhookProcessor,
    PlatformAdapterFactory,
    RappiAdapter,
    IfoodAdapter,
    DomiciliosAdapter,
    UberEatsAdapter,
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
