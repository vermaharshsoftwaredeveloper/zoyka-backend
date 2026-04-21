import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";

const calculateTier = (totalSpend) => {
    if (totalSpend >= 50000) return "Platinum";
    if (totalSpend >= 20000) return "Gold";
    if (totalSpend >= 5000) return "Silver";
    return "Bronze";
};

export const getAllCustomersService = async ({ page, limit, search }) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalCustomers, newCustomersCount, totalDeliveredOrders] = await Promise.all([
        prisma.user.count({ where: { role: 'USER' } }),
        prisma.user.count({ where: { role: 'USER', createdAt: { gte: thirtyDaysAgo } } }),
        prisma.order.count({ where: { status: 'DELIVERED' } })
    ]);

    const avgOrderPerCustomer = totalCustomers > 0
        ? (totalDeliveredOrders / totalCustomers).toFixed(1)
        : 0;

    const where = { role: 'USER' };
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { mobile: { contains: search, mode: 'insensitive' } }
        ];
    }

    const skip = (page - 1) * limit;
    const [totalFiltered, users] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, name: true, email: true, mobile: true, isEmailVerified: true, createdAt: true,
                orders: {
                    where: { status: 'DELIVERED' },
                    orderBy: { createdAt: 'desc' },
                    select: { totalAmount: true, createdAt: true }
                }
            }
        })
    ]);

    const formattedCustomers = users.map(user => {
        const totalSpend = user.orders.reduce((sum, order) => sum + order.totalAmount, 0);
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            isVerified: user.isEmailVerified,
            ordersCount: user.orders.length,
            totalSpend,
            tier: calculateTier(totalSpend),
            lastOrderDate: user.orders[0]?.createdAt || null,
            joinedAt: user.createdAt
        };
    });

    return {
        stats: { totalCustomers, avgOrderPerCustomer, newCustomers: newCustomersCount },
        customers: {
            data: formattedCustomers,
            meta: { total: totalFiltered, page, limit, totalPages: Math.ceil(totalFiltered / limit) }
        }
    };
};

export const getCustomerByIdService = async (id, filters) => {
    const { page, limit, startDate, endDate } = filters;

    const user = await prisma.user.findUnique({
        where: { id, role: 'USER' },
        include: {
            addresses: true,
            _count: { select: { reviews: true, wishlist: true } }
        }
    });

    if (!user) throw new ApiError(404, "Customer not found");

    const orderWhere = { userId: id };
    if (startDate && endDate) {
        orderWhere.createdAt = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const skip = (page - 1) * limit;
    const [totalOrders, orders] = await Promise.all([
        prisma.order.count({ where: orderWhere }),
        prisma.order.findMany({
            where: orderWhere, skip, take: limit, orderBy: { createdAt: 'desc' },
            include: { product: { select: { title: true, outlet: { select: { name: true } } } } }
        })
    ]);

    const lifetimeSpend = await prisma.order.aggregate({
        where: { userId: id, status: 'DELIVERED' }, _sum: { totalAmount: true }
    });

    const totalSpend = lifetimeSpend._sum.totalAmount || 0;

    return {
        profile: {
            id: user.id, name: user.name, email: user.email, mobile: user.mobile,
            isVerified: user.isEmailVerified, joinedAt: user.createdAt,
            tier: calculateTier(totalSpend),
            lifetimeSpend: totalSpend,
            totalReviews: user._count.reviews,
            savedAddresses: user.addresses
        },
        ordersHistory: {
            data: orders,
            meta: { total: totalOrders, page, limit, totalPages: Math.ceil(totalOrders / limit) }
        }
    };
};

export const getNewCustomersService = async () => {
    const users = await prisma.user.findMany({
        where: { role: 'USER' },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, isEmailVerified: true, createdAt: true }
    });
    return users;
};

export const verifyCustomerService = async (id) => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new ApiError(404, "Customer not found");
    if (user.isEmailVerified) throw new ApiError(400, "Customer is already verified");

    return await prisma.user.update({
        where: { id },
        data: { isEmailVerified: true, otp: null, otpExpiry: null, otpPurpose: null },
        select: { id: true, name: true, email: true, isEmailVerified: true }
    });
};