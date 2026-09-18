import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import config from "../config/index.ts";

// CreateToken
const createToken = (
	payload: JwtPayload,
	secret: string,
	expiresIn: SignOptions["expiresIn"],
) => {
	const token = jwt.sign(payload, secret, {
		expiresIn: expiresIn!,
	});

	return token;
};

// VerifyToken
const verifyToken = (token: string, secret: string) => {
	try {
		const verifiedToken = jwt.verify(token, secret);

		return {
			success: true as const,
			data: verifiedToken,
		};
	} catch (error: unknown) {
		return {
			success: false as const,
			error,
		};
	}
};

// CreateAccessToken
const createAccessToken = (payload: JwtPayload) => {
	return createToken(
		payload,
		config.jwt_access_secret,
		config.jwt_access_expires_in,
	);
};

// CreateRefreshToken
const createRefreshToken = (payload: JwtPayload) => {
	return createToken(
		payload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in,
	);
};

// VerifyAccessToken
const verifyAccessToken = (token: string) => {
	return verifyToken(token, config.jwt_access_secret);
};

// VerifyRefreshToken
const verifyRefreshToken = (token: string) => {
	return verifyToken(token, config.jwt_refresh_secret);
};

export const jwtUtils = {
	createToken,
	verifyToken,
	createAccessToken,
	createRefreshToken,
	verifyAccessToken,
	verifyRefreshToken,
};
