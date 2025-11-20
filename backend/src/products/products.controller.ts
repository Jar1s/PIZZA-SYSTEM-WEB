import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Param, 
  Body, 
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CategoriesService } from './categories.service';
import { TenantsService } from '../tenants/tenants.service';
import { CreateProductDto, UpdateProductDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller(':tenantSlug/products')
export class ProductsController {
  constructor(
    private productsService: ProductsService,
    private categoriesService: CategoriesService,
    private tenantsService: TenantsService,
  ) {}

  @Public()
  @Get()
  async getProducts(
    @Param('tenantSlug') tenantSlug: string,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
  ) {
    const tenant = await this.tenantsService.getTenantBySlug(tenantSlug);
    
    // Parse isActive query param
    let isActiveFilter: boolean | undefined = true; // Default to active only
    if (isActive === 'false') {
      isActiveFilter = false;
    } else if (isActive === 'all' || isActive === 'undefined') {
      isActiveFilter = undefined; // Return all products
    }
    
    return this.productsService.getProducts(tenant.id, {
      category,
      isActive: isActiveFilter,
    });
  }

  @Public()
  @Get('categories')
  async getCategories(@Param('tenantSlug') tenantSlug: string) {
    const tenant = await this.tenantsService.getTenantBySlug(tenantSlug);
    return this.categoriesService.getCategories(tenant.id);
  }

  @Public()
  @Get(':id')
  async getProduct(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }

  @Post()
  @Roles('ADMIN', 'OPERATOR')
  async createProduct(
    @Param('tenantSlug') tenantSlug: string,
    @Body() data: CreateProductDto,
  ) {
    const tenant = await this.tenantsService.getTenantBySlug(tenantSlug);
    return this.productsService.createProduct(tenant.id, data);
  }

  @Patch(':id')
  @Roles('ADMIN', 'OPERATOR')
  async updateProduct(
    @Param('id') id: string,
    @Body() data: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(id, data);
  }

  @Delete(':id')
  @Roles('ADMIN', 'OPERATOR')
  async deleteProduct(@Param('id') id: string) {
    await this.productsService.deleteProduct(id);
    return { message: 'Product deleted' };
  }

  @Post('bulk-import')
  @Roles('ADMIN', 'OPERATOR')
  async bulkImport(
    @Param('tenantSlug') tenantSlug: string,
    @Body() products: CreateProductDto[],
  ) {
    const tenant = await this.tenantsService.getTenantBySlug(tenantSlug);
    const count = await this.productsService.bulkImportProducts(tenant.id, products);
    return { imported: count };
  }
}


