import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";
import { hashPassword } from "../auth/utils/password.utils.js";

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
            managedOutlet: {
                select: {
                    id: true,
                    name: true,
                    isActive: true,
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
};

export const addOperationalManagerService = async (payload) => {
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [{ email: payload.email }, { mobile: payload.mobile }]
        }
    });

    if (existingUser) {
        throw new ApiError(409, "A user with this email or mobile number already exists.");
    }

    const hashedPassword = await hashPassword(payload.password);

    return await prisma.user.create({
        data: {
            name: payload.name,
            email: payload.email,
            mobile: payload.mobile,
            password: hashedPassword,
            role: 'MANAGER',
            isEmailVerified: true
        },
        select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            role: true,
            createdAt: true
        }
    });
};