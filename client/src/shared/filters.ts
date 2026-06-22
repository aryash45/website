export interface CatalogFilters {
  size?: string;
  color?: string;
  priceMin?: number;
  priceMax?: number;
  sort?: string;
}

export function parseFiltersFromQuery(queryString: string): CatalogFilters {
  const params = new URLSearchParams(queryString.replace(/^\?/, ""));
  const price = params.get("price");
  let priceMin: number | undefined;
  let priceMax: number | undefined;
  if (price) {
    const [min, max] = price.split("-");
    priceMin = min ? Number(min) : undefined;
    priceMax = max ? Number(max) : undefined;
  }
  return {
    size: params.get("size") || undefined,
    color: params.get("color") || undefined,
    priceMin,
    priceMax,
    sort: params.get("sort") || undefined,
  };
}


