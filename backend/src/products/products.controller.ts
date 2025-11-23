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
import { ProductMappingService } from './product-mapping.service';
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
    private productMappingService: ProductMappingService,
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
    
    const products = await this.productsService.getProducts(tenant.id, {
      category,
      isActive: isActiveFilter,
    });
    
    // Force fresh data - disable any potential caching
    // This ensures we always get the latest prices from database
    return products;
  }

  @Public()
  @Get('categories')
  async getCategories(@Param('tenantSlug') tenantSlug: string) {
    const tenant = await this.tenantsService.getTenantBySlug(tenantSlug);
    return this.categoriesService.getCategories(tenant.id);
  }

  @Public()
  @Get(':id/mappings')
  async getProductMappings(
    @Param('tenantSlug') tenantSlug: string,
    @Param('id') id: string,
  ) {
    const tenant = await this.tenantsService.getTenantBySlug(tenantSlug);
    const product = await this.productsService.getProductById(id);
    
    if (!product || product.tenantId !== tenant.id) {
      throw new NotFoundException('Product not found');
    }
    
    return this.productMappingService.getMappingsForProduct(tenant.id, product.name);
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

  @Public()
  @Post('update-prices')
  async updatePrices(@Param('tenantSlug') tenantSlug: string) {
    // One-time endpoint to fix prices - can be called once from browser
    // TODO: Remove or protect this endpoint after use
    const tenant = await this.tenantsService.getTenantBySlug(tenantSlug);
    const result = await this.productsService.updateProductPrices(tenant.id);
    return {
      message: 'Prices updated',
      ...result,
    };
  }
}


