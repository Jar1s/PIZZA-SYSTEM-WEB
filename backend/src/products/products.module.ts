import { Module, forwardRef } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { CategoriesService } from './categories.service';
import { ProductMappingService } from './product-mapping.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TenantsModule } from '../tenants/tenants.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, forwardRef(() => TenantsModule), AuthModule],
  controllers: [ProductsController],
  providers: [ProductsService, CategoriesService, ProductMappingService],
  exports: [ProductsService, CategoriesService, ProductMappingService],
})
export class ProductsModule {}














