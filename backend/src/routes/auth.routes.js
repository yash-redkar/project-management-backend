import { Router } from "express";
import {
    changeCurrentPassword,
    forgotPasswordRequest,
    getCurrentUser,
    googleLogin,
    googleLoginCallback,
    login,
    logoutUser,
    refreshAccessToken,
    registerUser,
    resendEmailVerification,
    resetForgotPassword,
    uploadAvatar,
    verifyEmail,
    updateAccountDetails,
} from "../controllers/auth.controllers.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
    userChangedCurrentPasswordValidator,
    userForgotPasswordValidator,
    userLoginValidator,
    userRegisterValidator,
    userResetForgotPasswordValidator,
    userUpdateAccountValidator,
} from "../validators/index.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    upload,
    uploadToCloudinary,
} from "../middlewares/multer.middleware.js";

const router = Router();

//unsecured route
router.route("/register").post(userRegisterValidator(), validate, registerUser);
router.route("/login").post(userLoginValidator(), validate, login);
router.route("/google").get(googleLogin);
router.route("/google/callback").get(googleLoginCallback);
router.route("/verify-email/:verificationToken").get(verifyEmail);
router.route("/refresh-token").post(refreshAccessToken);
router
    .route("/forgot-password")
    .post(userForgotPasswordValidator(), validate, forgotPasswordRequest);
router
    .route("/reset-password/:resetToken")
    .post(userResetForgotPasswordValidator(), validate, resetForgotPassword);

//secure routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router
    .route("/update-account")
    .patch(
        verifyJWT,
        userUpdateAccountValidator(),
        validate,
        updateAccountDetails,
    );
router
    .route("/change-password")
    .post(
        verifyJWT,
        userChangedCurrentPasswordValidator(),
        validate,
        changeCurrentPassword,
    );
router
    .route("/resend-email-verification")
    .post(verifyJWT, resendEmailVerification);
router
    .route("/avatar")
    .post(verifyJWT, upload.single("avatar"), uploadToCloudinary, uploadAvatar);

export default router;
