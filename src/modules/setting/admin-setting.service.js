import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";

export const getAllSettingsService = async (category) => {
    const where = category ? { category } : {};
    return prisma.settingConfig.findMany({
        where,
        orderBy: [{ category: 'asc' }, { key: 'asc' }]
    });
};

export const getSettingByKeyService = async (key) => {
    const setting = await prisma.settingConfig.findUnique({ where: { key } });
    if (!setting) throw new ApiError(404, `Setting with key '${key}' not found`);
    return setting;
};

export const createSettingService = async (data) => {
    const exists = await prisma.settingConfig.findUnique({ where: { key: data.key } });
    if (exists) throw new ApiError(400, `Setting with key '${data.key}' already exists`);
    return prisma.settingConfig.create({ data });
};

export const updateSettingByKeyService = async (key, data) => {
    const exists = await prisma.settingConfig.findUnique({ where: { key } });
    if (!exists) throw new ApiError(404, `Setting with key '${key}' not found`);
    return prisma.settingConfig.update({ where: { key }, data });
};

export const deleteSettingByKeyService = async (key) => {
    const exists = await prisma.settingConfig.findUnique({ where: { key } });
    if (!exists) throw new ApiError(404, `Setting with key '${key}' not found`);
    return prisma.settingConfig.delete({ where: { key } });
};