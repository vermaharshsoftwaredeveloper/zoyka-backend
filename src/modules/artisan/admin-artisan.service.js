import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";
import * as bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { API_BASE_URL } from "../../config/env.js";

const generateKey = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const processAvatar = async (avatar) => {
    if (!avatar) return null;
    if (typeof avatar !== 'string') return null;
    if (avatar.startsWith('data:image/')) {
        const matches = avatar.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (!matches) throw new ApiError(400, 'Invalid avatar image data');
        const mime = matches[1];
        const ext = mime.split('/')[1].split('+')[0];
        const data = matches[2];
        const buffer = Buffer.from(data, 'base64');
        const filename = `artisan_${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, buffer);
        return `${API_BASE_URL}/api/uploads/${filename}`;
    }                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
    return avatar;
};

export const getAllArtisansAdminService = async (filters) => {
    const where = { owner: { role: 'ARTISAN' } };
    if (filters.outletId) {
      where.OR = [
        { id: filters.outletId },
        { parentOutletId: filters.outletId },
      ];
    }
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.regionId) where.regionId = filters.regionId;
    const artisans = await prisma.outlet.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            owner: { select: { id: true, name: true, email: true, mobile: true, yearsOfExperience: true, avatar: true } },
            category: { select: { id: true, name: true } },
            region: { select: { id: true, name: true } }
        }
    });
    return artisans.map((artisan) => ({
        id: artisan.id,
        artisanId: artisan.owner?.id || null,
        artisanName: artisan.owner?.name || '',
        phone: artisan.owner?.mobile || '',
        email: artisan.owner?.email || '',
        outletName: artisan.name,
        outletId: artisan.id,
        categoryId: artisan.categoryId || null,
        regionId: artisan.regionId || null,
        category: artisan.category?.name || '',
        region: artisan.region?.name || '',
        monthlyCapacity: artisan.monthlyCapacity || 0,
        yearsOfExperience: artisan.owner?.yearsOfExperience || 0,
        image: artisan.owner?.avatar || '',
    }));
};

export const createArtisanService = async (data) => {
    const avatarUrl = await processAvatar(data.avatar);

    let user = await prisma.user.findFirst({
        where: { OR: [{ email: data.email }, { mobile: data.mobile }] }
    });
    if (user && user.role !== 'ARTISAN') {
        throw new ApiError(400, "User exists but is not an ARTISAN.");
    }
    if (!user) {
        const defaultPassword = await bcrypt.hash("Zoyka@123", 10);
        user = await prisma.user.create({
            data: {
                name: data.artisanName,
                email: data.email,
                mobile: data.mobile,
                password: defaultPassword,
                role: 'ARTISAN',
                isEmailVerified: true,
                yearsOfExperience: data.yearsOfExperience || 0,
                avatar: avatarUrl || null,
            }
        });
    } else {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                yearsOfExperience: data.yearsOfExperience || user.yearsOfExperience,
                avatar: avatarUrl || user.avatar,
            }
        });
    }

    let outlet;
    if (data.outletId) {
        const existingOutlet = await prisma.outlet.findUnique({ where: { id: data.outletId } });
        if (!existingOutlet) throw new ApiError(404, "Selected outlet does not exist.");

        if (existingOutlet.ownerId && existingOutlet.ownerId !== user.id) {
            outlet = await prisma.outlet.create({
                data: {
                    name: existingOutlet.name,
                    key: `${generateKey(existingOutlet.name)}-${Date.now()}`,
                    parentOutletId: existingOutlet.id,
                    ownerId: user.id,
                    monthlyCapacity: data.monthlyCapacity ?? existingOutlet.monthlyCapacity,
                    address: data.address ?? existingOutlet.address,
                    categoryId: data.categoryId ?? existingOutlet.categoryId,
                    regionId: data.regionId ?? existingOutlet.regionId,
                },
                include: {
                    owner: { select: { name: true, email: true, mobile: true, yearsOfExperience: true, avatar: true } },
                    category: { select: { id: true, name: true } },
                    region: { select: { id: true, name: true } }
                }
            });
        } else {
            outlet = await prisma.outlet.update({
                where: { id: data.outletId },
                data: {
                    ownerId: user.id,
                    monthlyCapacity: data.monthlyCapacity ?? existingOutlet.monthlyCapacity,
                    address: data.address ?? existingOutlet.address,
                    categoryId: data.categoryId ?? existingOutlet.categoryId,
                    regionId: data.regionId ?? existingOutlet.regionId,
                },
                include: {
                    owner: { select: { name: true, email: true, mobile: true, yearsOfExperience: true, avatar: true } },
                    category: { select: { id: true, name: true } },
                    region: { select: { id: true, name: true } }
                }
            });
        }
    } else {
        outlet = await prisma.outlet.create({
            data: {
                name: data.outletName,
                key: generateKey(data.outletName),
                ownerId: user.id,
                monthlyCapacity: data.monthlyCapacity || 0,
                address: data.address || null,
                categoryId: data.categoryId || null,
                regionId: data.regionId || null,
            },
            include: {
                owner: { select: { name: true, email: true, mobile: true, yearsOfExperience: true, avatar: true } },
                category: { select: { id: true, name: true } },
                region: { select: { id: true, name: true } }
            }
        });
    }

    return {
        id: outlet.id,
        artisanName: outlet.owner?.name || "",
        phone: outlet.owner?.mobile || "",
        email: outlet.owner?.email || "",
        outletName: outlet.name,
        outletId: outlet.id,
        categoryId: outlet.categoryId || null,
        regionId: outlet.regionId || null,
        category: outlet.category?.name || "",
        region: outlet.region?.name || "",
        monthlyCapacity: outlet.monthlyCapacity || 0,
        yearsOfExperience: outlet.owner?.yearsOfExperience || 0,
        image: outlet.owner?.avatar || "",
    };
};

export const getArtisanByIdAdminService = async (id) => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const outlet = await prisma.outlet.findUnique({
        where: { id },
        include: {
            owner: { select: { name: true, email: true, mobile: true } },
            productionBatches: { orderBy: { createdAt: 'desc' }, take: 10 },
            payouts: { orderBy: { createdAt: 'desc' }, take: 10 },
            products: { where: { isActive: true }, select: { id: true } }
        }
    });

    if (!outlet) throw new ApiError(404, "Artisan not found");

    const [orders, allTimeOrders] = await Promise.all([
        prisma.order.aggregate({
            where: { product: { outletId: id }, status: 'DELIVERED', createdAt: { gte: startOfMonth } },
            _sum: { totalAmount: true }, _count: { id: true }
        }),
        prisma.order.aggregate({
            where: { product: { outletId: id }, status: 'DELIVERED' },
            _sum: { quantity: true }
        })
    ]);

    return {
        overview: {
            contactInfo: {
                phone: outlet.owner?.mobile || "N/A",
                email: outlet.owner?.email || "N/A",
                address: outlet.address || "N/A"
            },
            performance: {
                ordersCompleted: orders._count.id || 0,
                earnings: orders._sum.totalAmount || 0,
                qualityScore: outlet.qualityScore || 0
            }
        },
        skus: {
            activeSKUsCount: outlet.products.length,
            totalUnitsSold: allTimeOrders._sum.quantity || 0
        },
        production: outlet.productionBatches,
        payments: outlet.payouts
    };
};

export const updateArtisanService = async (id, data) => {
    const outlet = await prisma.outlet.findUnique({ where: { id } });
    if (!outlet) throw new ApiError(404, "Artisan Outlet not found");

    const outletUpdate = {
        name: data.outletName,
        address: data.address,
        monthlyCapacity: data.monthlyCapacity,
        categoryId: data.categoryId,
        regionId: data.regionId,
        isActive: data.isActive,
    };

    await prisma.outlet.update({
        where: { id },
        data: outletUpdate
    });

    const avatarUrl = await processAvatar(data.avatar);

    if (outlet.ownerId) {
        const ownerUpdate = {};
        if (data.artisanName) ownerUpdate.name = data.artisanName;
        if (data.mobile) ownerUpdate.mobile = data.mobile;
        if (data.email) ownerUpdate.email = data.email;
        if (data.yearsOfExperience !== undefined) ownerUpdate.yearsOfExperience = data.yearsOfExperience;
        if (avatarUrl) ownerUpdate.avatar = avatarUrl;

        if (Object.keys(ownerUpdate).length > 0) {
            await prisma.user.update({
                where: { id: outlet.ownerId },
                data: ownerUpdate
            });
        }
    }

    const updatedOutlet = await prisma.outlet.findUnique({
        where: { id },
        include: {
            owner: { select: { name: true, email: true, mobile: true, yearsOfExperience: true, avatar: true } },
            category: { select: { id: true, name: true } },
            region: { select: { id: true, name: true } }
        }
    });

    return {
        id: updatedOutlet.id,
        artisanName: updatedOutlet.owner?.name || '',
        phone: updatedOutlet.owner?.mobile || '',
        email: updatedOutlet.owner?.email || '',
        outletName: updatedOutlet.name,
        outletId: updatedOutlet.id,
        categoryId: updatedOutlet.categoryId || null,
        regionId: updatedOutlet.regionId || null,
        category: updatedOutlet.category?.name || '',
        region: updatedOutlet.region?.name || '',
        monthlyCapacity: updatedOutlet.monthlyCapacity || 0,
        yearsOfExperience: updatedOutlet.owner?.yearsOfExperience || 0,
        image: updatedOutlet.owner?.avatar || '',
    };
};

export const deleteArtisanService = async (id) => {
    const outlet = await prisma.outlet.findUnique({ where: { id } });
    if (!outlet) throw new ApiError(404, "Artisan Outlet not found");

    await prisma.outlet.delete({ where: { id } });
    return { id };
};

export const toggleArtisanStatusService = async (id) => {
    const outlet = await prisma.outlet.findUnique({ where: { id } });
    if (!outlet) throw new ApiError(404, "Artisan/Outlet not found");

    return await prisma.outlet.update({
        where: { id },
        data: { isActive: !outlet.isActive },
    });
};

export const checkUserByEmailOrMobileService = async ({ email, mobile }) => {
    if (!email && !mobile) return null;
    const user = await prisma.user.findFirst({
        where: { OR: [
            email ? { email } : undefined,
            mobile ? { mobile } : undefined
        ].filter(Boolean) },
        select: { id: true, role: true, email: true, mobile: true, name: true }
    });

    if (!user) return null;
    return { id: user.id, role: user.role, email: user.email, mobile: user.mobile, name: user.name };
};