// src/api/productApi.ts
import http from "./http";
import type {
    Product,
    CreateProductDto,
    UpdateProductDto,
    ProductFilterDto,
    PaginatedResult
} from "../types/product";

export const productApi = {
    getAll: () => http.get<Product[]>("/product"),
    getAllBySupplier: (supplierId: number) => http.get<Product[]>(`/product/By-Supplier/${supplierId}`),


    getById: (id: number) => http.get<Product>(`/product/${id}`),

    create: (data: CreateProductDto) => http.post("/product", data),

    update: (id: number, data: UpdateProductDto) =>
        http.put(`/product/${id}`, data),

    delete: (id: number) => http.delete(`/product/${id}`),

    filter: (dto: ProductFilterDto) =>
        http.post<PaginatedResult<Product>>("/product/filter", dto),
};
