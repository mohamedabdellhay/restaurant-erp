import { FRONTEND_PERMISSION_GROUPS } from "../../utils/constants/frontendPermissions.js";
import ResponseHandler from "../../utils/responseHandler.js";
import asyncHandler from "../../utils/asyncHandler.js";

class PermissionController {
    /**
     * Get permission metadata for frontend UI organization
     * GET /api/permissions/metadata
     */
    getPermissionMetadata = asyncHandler(async (req, res) => {
        ResponseHandler.success(
            res,
            FRONTEND_PERMISSION_GROUPS,
            "Permission metadata retrieved successfully"
        );
    });
}

export default new PermissionController();
