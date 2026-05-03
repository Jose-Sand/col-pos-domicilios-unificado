import { Injectable } from '@nestjs/common';
import { Platform } from '@prisma/client';
import { IPlatformAdapter } from './platform-adapter.interface';
import { RappiAdapter } from './rappi.adapter';
import { IfoodAdapter } from './ifood.adapter';
import { DomiciliosAdapter } from './domicilios.adapter';
import { UberEatsAdapter } from './uber-eats.adapter';

@Injectable()
export class PlatformAdapterFactory {
  constructor(
    private rappiAdapter: RappiAdapter,
    private ifoodAdapter: IfoodAdapter,
    private domiciliosAdapter: DomiciliosAdapter,
    private uberEatsAdapter: UberEatsAdapter,
  ) {}

  getAdapter(platform: Platform): IPlatformAdapter {
    switch (platform) {
      case Platform.RAPPI:
        return this.rappiAdapter;
      case Platform.IFOOD:
        return this.ifoodAdapter;
      case Platform.DOMICILIOS_COM:
        return this.domiciliosAdapter;
      case Platform.UBER_EATS:
        return this.uberEatsAdapter;
      default:
        throw new Error(`Adaptador no encontrado para plataforma: ${platform}`);
    }
  }
}
