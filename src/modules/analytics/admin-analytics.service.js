import prisma from "../../config/prisma.js";

export const getAnalyticsDashboardService = async (filters) => {
    const { categoryId, regionId, startDate, endDate } = filters;

    const orderWhere = { status: 'DELIVERED' };
    const outletWhere = {};
    const productWhere = {};

    if (categoryId) {
        orderWhere.product = { ...orderWhere.product, categoryId };
        outletWhere.categoryId = categoryId;
        productWhere.categoryId = categoryId;
    }
    if (regionId) {
        orderWhere.product = { ...orderWhere.product, outlet: { regionId } };
        outletWhere.regionId = regionId;
        productWhere.outlet = { regionId };
    }
    if (startDate && endDate) {
        orderWhere.createdAt = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const [allOrders, allUsersCount, allProducts, allOutlets] = await Promise.all([
        prisma.order.findMany({
            where: orderWhere,
            select: {
                totalAmount: true,
                quantity: true,
                createdAt: true,
                userId: true,
                product: { select: { category: { select: { name: true } }, outlet: { select: { name: true, owner: { select: { role: true } } } } } }
            }
        }),
        prisma.user.count({ where: { role: 'USER' } }),
        prisma.product.findMany({ where: productWhere, select: { stock: true } }),
        prisma.outlet.findMany({
            where: outletWhere,
            select: {
                name: true,
                products: { select: { orders: { where: { status: 'DELIVERED' }, select: { totalAmount: true } } } }
            }
        })
    ]);

    const totalOrders = allOrders.length;
    const totalRevenue = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    const userOrderCounts = {};
    allOrders.forEach(order => {
        userOrderCounts[order.userId] = (userOrderCounts[order.userId] || 0) + 1;
    });
    const buyingCustomers = Object.keys(userOrderCounts).length;
    const repeatCustomers = Object.values(userOrderCounts).filter(count => count > 1).length;
    const repeatRate = buyingCustomers ? ((repeatCustomers / buyingCustomers) * 100).toFixed(1) : 0;

    const conversionRate = allUsersCount ? ((buyingCustomers / allUsersCount) * 100).toFixed(1) : 0;

    const revenueDistribution = { FOOD: 0, ARTISAN: 0, FARM: 0 };
    allOrders.forEach(order => {
        const role = order.product?.outlet?.owner?.role;
        if (role === 'KITCHEN') revenueDistribution.FOOD += order.totalAmount;
        if (role === 'ARTISAN') revenueDistribution.ARTISAN += order.totalAmount;
        if (role === 'FARMER') revenueDistribution.FARM += order.totalAmount;
    });

    const totalUnitsSold = allOrders.reduce((sum, order) => sum + order.quantity, 0);
    const totalCurrentStock = allProducts.reduce((sum, p) => sum + p.stock, 0);
    const turnoverRate = totalCurrentStock > 0 ? (totalUnitsSold / totalCurrentStock).toFixed(2) : totalUnitsSold;

    const outletProductivity = allOutlets.map(outlet => {
        const revenue = outlet.products.reduce((prodSum, prod) => {
            return prodSum + prod.orders.reduce((ordSum, ord) => ordSum + ord.totalAmount, 0);
        }, 0);
        return { name: outlet.name, revenue };
    })
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    const growthTrendMap = {};

    allOrders.forEach(order => {
        const month = order.createdAt.toISOString().slice(0, 7);
        const role = order.product?.outlet?.owner?.role;
        let categoryKey = "OTHER";
        if (role === 'KITCHEN') categoryKey = 'FOOD';
        if (role === 'ARTISAN') categoryKey = 'ARTISAN';
        if (role === 'FARMER') categoryKey = 'FARM';

        if (!growthTrendMap[month]) {
            growthTrendMap[month] = { month, FOOD: 0, ARTISAN: 0, FARM: 0, OTHER: 0, total: 0 };
        }
        growthTrendMap[month][categoryKey] += order.totalAmount;
        growthTrendMap[month].total += order.totalAmount;
    });

    const growthTrend = Object.values(growthTrendMap).sort((a, b) => a.month.localeCompare(b.month));

    return {
        cards: {
            totalOrders,
            totalRevenue,
            conversionRate: Number(conversionRate),
            repeatRate: Number(repeatRate)
        },
        revenueDistribution: [
            { id: "FOOD", label: "Food Revenue", value: revenueDistribution.FOOD },
            { id: "ARTISAN", label: "Artisan Revenue", value: revenueDistribution.ARTISAN },
            { id: "FARM", label: "Farm Revenue", value: revenueDistribution.FARM }
        ],
        inventoryTurnover: {
            totalUnitsSold,
            totalCurrentStock,
            turnoverRate: Number(turnoverRate)
        },
        topOutlets: outletProductivity,
        growthTrend
    };
};