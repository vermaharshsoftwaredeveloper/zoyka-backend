import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";

const getDateBoundaries = (range, start, end) => {
    const now = new Date();
    if (range === 'this_week') {
        const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
        firstDay.setHours(0, 0, 0, 0);
        return { gte: firstDay };
    }
    if (range === 'this_month') {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        return { gte: firstDay };
    }
    if (range === 'custom') {
        return { gte: new Date(start), lte: new Date(end) };
    }
    return undefined;
};

export const getAllOrdersAdminService = async (filters) => {
    const { page, limit, search, status, categoryId, regionId, outletId, dateRange, startDate, endDate } = filters;

    const where = {};

    if (search) {
        where.OR = [
            { id: { contains: search, mode: 'insensitive' } },
            { user: { name: { contains: search, mode: 'insensitive' } } },
            { product: { title: { contains: search, mode: 'insensitive' } } }
        ];
    }

    if (status) where.status = status;

    if (categoryId || outletId || regionId) {
        where.product = {
            ...(categoryId && { categoryId }),
            ...(outletId && { outletId }),
            ...(regionId && { outlet: { regionId } })
        };
    }

    if (dateRange) {
        where.createdAt = getDateBoundaries(dateRange, startDate, endDate);
    }

    const skip = (page - 1) * limit;
    const [total, orders] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, name: true, email: true, mobile: true } },
                address: true, // Include full address for delivery details
                product: {
                    select: {
                        id: true,
                        title: true,
                        category: { select: { name: true } },
                        outlet: { select: { name: true, region: { select: { name: true } } } }
                    }
                }
            }
        })
    ]);

    const formattedOrders = orders.map(order => ({
        orderId: order.id,
        customerName: order.user.name,
        itemDetails: `${order.quantity}x ${order.product.title}`,
        totalAmount: order.totalAmount,
        status: order.status,
        date: order.createdAt,
        outlet: order.product.outlet?.name || "N/A",
        region: order.product.outlet?.region?.name || "N/A",
        category: order.product.category?.name || "N/A",
        // Include address details for delivery information
        address: order.address ? {
            fullName: order.address.fullName,
            phoneNumber: order.address.phoneNumber,
            line1: order.address.line1,
            line2: order.address.line2,
            landmark: order.address.landmark,
            district: order.address.district,
            state: order.address.state,
            pincode: order.address.pincode,
        } : null,
    }));

    return {
        data: formattedOrders,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
};

export const getOrderByIdAdminService = async (id) => {
    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            user: { select: { id: true, name: true, email: true, mobile: true } },
            address: true,
            product: {
                include: {
                    images: { take: 1, select: { url: true } },
                    category: { select: { id: true, name: true } },
                    outlet: {
                        select: {
                            id: true, name: true,
                            owner: { select: { name: true, mobile: true } },
                            region: { select: { id: true, name: true } }
                        }
                    }
                }
            }
        }
    });

    if (!order) throw new ApiError(404, "Order not found");
    return order;
};