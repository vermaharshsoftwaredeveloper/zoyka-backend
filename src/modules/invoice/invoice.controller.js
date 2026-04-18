import { asyncHandler } from "../../utils/async-handler/index.js";
import { getInvoiceByOrderIdService, listInvoicesService } from "./invoice.service.js";

export const getInvoiceByOrderId = asyncHandler(async (req, res) => {
  const data = await getInvoiceByOrderIdService({
    userId: req.user.id,
    orderId: req.params.orderId,
  });

  res.status(200).json({ message: "Invoice fetched successfully", data });
});

export const listInvoices = asyncHandler(async (req, res) => {
  const data = await listInvoicesService(req.user.id);

  res.status(200).json({ message: "Invoices fetched successfully", data });
});
