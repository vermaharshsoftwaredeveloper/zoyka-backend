import prisma from '../../config/prisma.js';

const calcPercChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(2));
};

export const getDashboardAggregations = async (period) => {
    const now = new Date();

    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const endOfToday = new Date(now.setHours(23, 59, 59, 999));

    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const endOfYesterday = new Date(startOfToday);
    endOfYesterday.setMilliseconds(-1);

    const startDateForTrends = new Date(startOfToday);
    if (period === 'YEARLY') {
        startDateForTrends.setMonth(startDateForTrends.getMonth() - 12);
    } else {
        startDateForTrends.setMonth(startDateForTrends.getMonth() - 6);
    }

    const [
        todayOrders, yesterdayOrders,
        todayRevenueAggr, yesterdayRevenueAggr,
        todayPendingQc, yesterdayPendingQc,
        todayDispatchPending, yesterdayDispatchPending,
        lowInventoryProducts
    ] = await Promise.all([
        prisma.order.count({ where: { createdAt: { gte: startOfToday, lte: endOfToday } } }),
        prisma.order.count({ where: { createdAt: { gte: startOfYesterday, lte: endOfYesterday } } }),

        prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: { createdAt: { gte: startOfToday, lte: endOfToday }, status: { not: 'CANCELLED' } }
        }),
        prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: { createdAt: { gte: startOfYesterday, lte: endOfYesterday }, status: { not: 'CANCELLED' } }
        }),

        prisma.order.count({ where: { status: 'PLACED', createdAt: { gte: startOfToday, lte: endOfToday } } }),
        prisma.order.count({ where: { status: 'PLACED', createdAt: { gte: startOfYesterday, lte: endOfYesterday } } }),

        prisma.order.count({ where: { status: 'PACKED', createdAt: { gte: startOfToday, lte: endOfToday } } }),
        prisma.order.count({ where: { status: 'PACKED', createdAt: { gte: startOfYesterday, lte: endOfYesterday } } }),

        prisma.product.count({ where: { stock: { lt: 10 } } })
    ]);

    const todayRevenue = todayRevenueAggr._sum.totalAmount || 0;
    const yesterdayRevenue = yesterdayRevenueAggr._sum.totalAmount || 0;

    const historicalOrders = await prisma.order.findMany({
        where: {
            createdAt: { gte: startDateForTrends },
            status: { not: 'CANCELLED' }
        },
        select: {
            createdAt: true,
            totalAmount: true,
            product: { select: { outlet: { select: { name: true } } } },
            address: { select: { state: true } }
        }
    });

    const categoryTrendData = {};
    const regionPerformanceData = {};

    historicalOrders.forEach(order => {
        const dateStr = order.createdAt.toISOString().split('T')[0];
        const category = order.product?.outlet?.name || 'Uncategorized';

        if (!categoryTrendData[dateStr]) categoryTrendData[dateStr] = {};
        if (!categoryTrendData[dateStr][category]) categoryTrendData[dateStr][category] = 0;
        categoryTrendData[dateStr][category] += order.totalAmount;

        const region = order.address?.state || 'Unknown';
        if (!regionPerformanceData[region]) regionPerformanceData[region] = { revenue: 0, orderCount: 0 };
        regionPerformanceData[region].revenue += order.totalAmount;
        regionPerformanceData[region].orderCount += 1;
    });

    const salesTrendGraph = Object.keys(categoryTrendData).map(date => ({
        date,
        categories: categoryTrendData[date]
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    const regionPerformance = Object.keys(regionPerformanceData).map(region => ({
        region,
        ...regionPerformanceData[region]
    })).sort((a, b) => b.revenue - a.revenue);

    const topProductGroup = await prisma.order.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        where: { status: { not: 'CANCELLED' } },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
    });

    const topProductIds = topProductGroup.map(tp => tp.productId);
    const productsList = await prisma.product.findMany({
        where: { id: { in: topProductIds } },
        select: { id: true, title: true, price: true, stock: true }
    });

    const topProducts = topProductGroup.map(tp => {
        const productDetail = productsList.find(p => p.id === tp.productId);
        return {
            id: productDetail?.id,
            title: productDetail?.title,
            price: productDetail?.price,
            stock: productDetail?.stock,
            totalSold: tp._sum.quantity
        };
    });

    return {
        section1_overviewCards: {
            todaysOrders: { count: todayOrders, changeFromYesterdayPercent: calcPercChange(todayOrders, yesterdayOrders) },
            pendingQc: { count: todayPendingQc, changeFromYesterdayPercent: calcPercChange(todayPendingQc, yesterdayPendingQc) },
            lowInventory: { count: lowInventoryProducts, changeFromYesterdayPercent: 0 }, // Requires cron snapshot for real %
            todaysRevenue: { amount: todayRevenue, changeFromYesterdayPercent: calcPercChange(todayRevenue, yesterdayRevenue) },
            dispatchPending: { count: todayDispatchPending, changeFromYesterdayPercent: calcPercChange(todayDispatchPending, yesterdayDispatchPending) },
        },
        section2_categorySalesTrend: salesTrendGraph,
        section3_regionPerformance: regionPerformance,
        section4_topProducts: topProducts
    };
};