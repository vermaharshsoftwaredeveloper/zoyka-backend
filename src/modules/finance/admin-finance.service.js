import prisma from "../../config/prisma.js";

const getRoleFromVertical = (vertical) => {
    if (vertical === "FOOD") return "KITCHEN";
    if (vertical === "ARTISAN") return "ARTISAN";
    if (vertical === "FARM") return "FARMER";
    return undefined;
};

export const getFinanceDashboardService = async (filters) => {
    const { vertical, page, limit } = filters;

    const [totalRev, foodRev, artisanRev, farmRev] = await Promise.all([
        prisma.order.aggregate({
            where: { status: 'DELIVERED' },
            _sum: { totalAmount: true }
        }),
        prisma.order.aggregate({
            where: { status: 'DELIVERED', product: { outlet: { owner: { role: 'KITCHEN' } } } },
            _sum: { totalAmount: true }
        }),
        prisma.order.aggregate({
            where: { status: 'DELIVERED', product: { outlet: { owner: { role: 'ARTISAN' } } } },
            _sum: { totalAmount: true }
        }),
        prisma.order.aggregate({
            where: { status: 'DELIVERED', product: { outlet: { owner: { role: 'FARMER' } } } },
            _sum: { totalAmount: true }
        })
    ]);

    const whereClause = {};
    const targetRole = getRoleFromVertical(vertical);

    if (targetRole) {
        whereClause.outlet = { owner: { role: targetRole } };
    }

    const skip = (page - 1) * limit;

    const [totalPayouts, payoutsData] = await Promise.all([
        prisma.payout.count({ where: whereClause }),
        prisma.payout.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                outlet: { select: { name: true, owner: { select: { name: true } } } }
            }
        })
    ]);

    const formattedPayouts = payoutsData.map(p => ({
        payoutId: p.id,
        vendorName: p.outlet.owner?.name || p.outlet.name,
        ordersCount: p.ordersCount,
        grossAmount: p.grossAmount,
        commission: p.commission,
        amount: p.amount,
        status: p.status,
        date: p.createdAt
    }));

    return {
        revenueStats: {
            totalRevenue: totalRev._sum.totalAmount || 0,
            foodRevenue: foodRev._sum.totalAmount || 0,
            artisanRevenue: artisanRev._sum.totalAmount || 0,
            farmRevenue: farmRev._sum.totalAmount || 0
        },
        payouts: {
            data: formattedPayouts,
            meta: {
                total: totalPayouts,
                page,
                limit,
                totalPages: Math.ceil(totalPayouts / limit)
            }
        }
    };
};