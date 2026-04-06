import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";
import { hashPassword } from "../auth/utils/password.utils.js";

export const getOperationalManagersService = async () => {
    return await prisma.user.findMany({
        where: { role: 'MANAGER' },
        select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            avatar: true,
            role: true,
            isActive: true,
            location: true,
            joiningDate: true,
            bankName: true,
            bankAccountNo: true,
            bankIfscCode: true,
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

    if (payload.outletId) {
        const outlet = await prisma.outlet.findUnique({ where: { id: payload.outletId } });
        if (!outlet) throw new ApiError(404, "The specified Outlet does not exist.");
        if (outlet.managerId) throw new ApiError(409, "This outlet already has an assigned manager!");
    }

    const hashedPassword = await hashPassword(payload.password);

    return await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
            data: {
                name: payload.name,
                email: payload.email,
                mobile: payload.mobile,
                password: hashedPassword,
                role: 'MANAGER',
                isEmailVerified: true,
                location: payload.location,
                avatar: payload.avatar,
                isActive: payload.isActive ?? true,
                joiningDate: payload.joiningDate ? new Date(payload.joiningDate) : new Date(),
                bankAccountNo: payload.bankAccountNo,
                bankName: payload.bankName,
                bankIfscCode: payload.bankIfscCode,
            },
            select: {
                id: true,
                name: true,
                email: true,
                mobile: true,
                role: true,
                isActive: true,
                createdAt: true
            }
        });

        if (payload.outletId) {
            await tx.outlet.update({
                where: { id: payload.outletId },
                data: { managerId: newUser.id }
            });
        }

        return newUser;
    });
};