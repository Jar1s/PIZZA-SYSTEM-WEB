import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateOrderDto } from './create-order.dto';

function buildOrder(items: any[]) {
  return plainToInstance(CreateOrderDto, {
    customer: { name: 'Test', email: 'test@example.com', phone: '+421900000000' },
    address: { street: 'Hlavné námestie 5', city: 'Bratislava', postalCode: '81101', country: 'SK' },
    items,
  });
}

async function errorsFor(items: any[]): Promise<string[]> {
  const errors = await validate(buildOrder(items), { whitelist: true });
  const flatten = (list: any[]): string[] =>
    list.flatMap((e) => [
      ...Object.values(e.constraints || {}),
      ...flatten(e.children || []),
    ]) as string[];
  return flatten(errors);
}

describe('CreateOrderDto input sanity', () => {
  it('accepts a normal order', async () => {
    expect(await errorsFor([{ productId: 'p1', quantity: 2 }])).toEqual([]);
  });

  it('rejects an empty cart', async () => {
    expect((await errorsFor([])).join(' ')).toContain('at least one item');
  });

  it.each([0, -3, 0.5, 51])('rejects quantity %p', async (quantity) => {
    const errors = await errorsFor([{ productId: 'p1', quantity }]);
    expect(errors.length).toBeGreaterThan(0);
  });
});
