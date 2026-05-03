import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../prisma/prisma.service';

@Processor('orders')
export class WebhookProcessor {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Actualiza inventario local basado en items de la orden
   */
  @Process('update-inventory')
  async handleInventoryUpdate(job: Job) {
    const { orderId, items } = job.data;
    
    this.logger.log(`Actualizando inventario para orden ${orderId}`);

    for (const item of items) {
      try {
        // Buscar producto por nombre (en producción usar mapping más robusto)
        const product = await this.prisma.product.findFirst({
          where: {
            nombre: {
              contains: item.nombre,
              mode: 'insensitive',
            },
          },
        });

        if (product) {
          await this.prisma.product.update({
            where: { id: product.id },
            data: {
              stock: Math.max(0, product.stock - item.cantidad),
            },
          });
          this.logger.debug(`Stock actualizado para ${product.nombre}`);
        }
      } catch (error) {
        this.logger.error(`Error actualizando stock: ${error.message}`);
      }
    }

    return { success: true };
  }
}
