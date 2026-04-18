import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";
import { hashPassword } from "../auth/utils/password.utils.js";
import fs from "fs";
import path from "path";
import { API_BASE_URL } from "../../config/env.js";

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

    // Handle avatar data URL upload if provided
    if (payload.avatar && typeof payload.avatar === 'string' && payload.avatar.startsWith('data:image/')) {
        try {
            const matches = payload.avatar.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
            if (!matches) throw new Error('Invalid image data');
            const mime = matches[1];
            const ext = mime.split('/')[1].split('+')[0];
            const data = matches[2];
            const buffer = Buffer.from(data, 'base64');
            const filename = `manager_${Date.now()}_${Math.floor(Math.random()*10000)}.${ext}`;
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
            const filePath = path.join(uploadDir, filename);
            fs.writeFileSync(filePath, buffer);
            // store the publicly served absolute URL
            payload.avatar = `${API_BASE_URL}/api/uploads/${filename}`;
        } catch (err) {
            throw new ApiError(400, 'Failed to process avatar image');
        }
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
                }
        });

        return newUser;
    });
};

export const updateOperationalManagerService = async (managerId, payload) => {
    const manager = await prisma.user.findUnique({ where: { id: managerId } });
    if (!manager) throw new ApiError(404, "Manager not found");
    if (manager.role !== 'MANAGER') throw new ApiError(400, "User is not a manager");

    // Handle avatar data URL upload if provided
    if (payload.avatar && typeof payload.avatar === 'string' && payload.avatar.startsWith('data:image/')) {
        try {
            const matches = payload.avatar.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
            if (!matches) throw new Error('Invalid image data');
            const mime = matches[1];
            const ext = mime.split('/')[1].split('+')[0];
            const data = matches[2];
            const buffer = Buffer.from(data, 'base64');
            const filename = `manager_${Date.now()}_${Math.floor(Math.random()*10000)}.${ext}`;
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
            const filePath = path.join(uploadDir, filename);
            fs.writeFileSync(filePath, buffer);
            payload.avatar = `${API_BASE_URL}/api/uploads/${filename}`;
        } catch (err) {
            throw new ApiError(400, 'Failed to process avatar image');
        }
    }

    // If password provided, hash it
    if (payload.password) {
        payload.password = await hashPassword(payload.password);
    }

    return await prisma.$transaction(async (tx) => {
        // Find previous outlet assigned to this manager
        const previousOutlet = await tx.outlet.findFirst({ where: { managerId } });

        // Build update data for user
        const updateData = {};
        const allowed = [
            'name',
            'email',
            'mobile',
            'location',
            'avatar',
            'isActive',
            'joiningDate',
            'bankAccountNo',
            'bankName',
            'bankIfscCode',
            'password'
        ];

        for (const key of allowed) {
            if (payload[key] !== undefined) {
                updateData[key] = key === 'joiningDate' && payload[key] ? new Date(payload[key]) : payload[key];
            }
        }

        const updatedUser = await tx.user.update({
            where: { id: managerId },
            data: updateData,
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
            }
        });

        return updatedUser;
    });
};

export const deleteOperationalManagerService = async (managerId) => {
    const manager = await prisma.user.findUnique({ where: { id: managerId } });
    if (!manager) throw new ApiError(404, "Manager not found");
    if (manager.role !== 'MANAGER') throw new ApiError(400, "User is not a manager");

    return await prisma.$transaction(async (tx) => {
        await tx.outlet.updateMany({ where: { managerId }, data: { managerId: null } });
        return await tx.user.delete({ where: { id: managerId } });
    });
};