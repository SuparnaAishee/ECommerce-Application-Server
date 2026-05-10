export interface IProductQuery {
  name?: string | undefined;
  price?: number | undefined;
  category?: string | undefined;
  searchTerm?: string | undefined;
  isFlashSale?: string | boolean | undefined;
}
