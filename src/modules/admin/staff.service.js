import prisma from "../../config/prisma.js";

export const getOperationalManagersService = async () => {
    return await prisma.user.findMany({
        where: {
            role: 'MANAGER'
        },
        select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            avatar: true,
            role: true,
            isEmailVerified: true,
            createdAt: true,
            managedRegions: {
                select: {
                    id: true,
                    name: true,
                    isActive: true,
                    _count: {
                        select: { outlets: true }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
};