import ApiError from "../../utils/api-error/index.js";
import { asyncHandler } from "../../utils/async-handler/index.js";
import {
  createAddressSchema,
  updateAddressSchema,
} from "./address.validation.js";
import {
  createAddressService,
  deleteAddressService,
  listAddressesService,
  updateAddressService,
} from "./address.service.js";

const parseBody = (schema, body) => {
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new ApiError(400, issue?.message || "Invalid request body");
  }

  return parsed.data;
};

export const listAddresses = asyncHandler(async (req, res) => {
  const data = await listAddressesService(req.user.id);

  res.status(200).json({
    message: "Addresses fetched successfully",
    data,
  });
});

export const createAddress = asyncHandler(async (req, res) => {
  const payload = parseBody(createAddressSchema, req.body);
  const data = await createAddressService(req.user.id, payload);

  res.status(201).json({
    message: "Address created successfully",
    data,
  });
});

export const updateAddress = asyncHandler(async (req, res) => {
  const payload = parseBody(updateAddressSchema, req.body);
  const data = await updateAddressService({
    userId: req.user.id,
    addressId: req.params.addressId,
    payload,
  });

  res.status(200).json({
    message: "Address updated successfully",
    data,
  });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const data = await deleteAddressService({
    userId: req.user.id,
    addressId: req.params.addressId,
  });

  res.status(200).json(data);
});
