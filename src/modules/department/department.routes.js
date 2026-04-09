// src/modules/department/department.routes.js

import { Router } from "express";
import { getAllDepartments } from "./department.controller.js";

const router = Router();

router.get("/", getAllDepartments);

export default router;