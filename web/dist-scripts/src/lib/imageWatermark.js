"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addLogoWatermark = addLogoWatermark;
const sharp_1 = __importDefault(require("sharp"));
const path_1 = require("path");
const promises_1 = require("fs/promises");
const logoPath = (0, path_1.join)(process.cwd(), "public", "images", "logo", "logoTransparent.png");
let cachedLogo = null;
async function getLogoBuffer() {
    if (cachedLogo)
        return cachedLogo;
    const data = await (0, promises_1.readFile)(logoPath);
    cachedLogo = data;
    return data;
}
async function addLogoWatermark(imageBuffer, options = {}) {
    var _a, _b, _c, _d, _e, _f, _g;
    const padding = (_a = options.padding) !== null && _a !== void 0 ? _a : 32;
    const maxLogoWidthRatio = (_b = options.maxLogoWidthRatio) !== null && _b !== void 0 ? _b : 0.25;
    const maxLogoHeightRatio = (_c = options.maxLogoHeightRatio) !== null && _c !== void 0 ? _c : 0.18;
    const base = (0, sharp_1.default)(imageBuffer);
    const metadata = await base.metadata();
    const width = (_d = metadata.width) !== null && _d !== void 0 ? _d : 0;
    const height = (_e = metadata.height) !== null && _e !== void 0 ? _e : 0;
    if (!width || !height) {
        return imageBuffer;
    }
    const logoBuffer = await getLogoBuffer();
    let logo = (0, sharp_1.default)(logoBuffer);
    const logoMeta = await logo.metadata();
    const logoWidth = (_f = logoMeta.width) !== null && _f !== void 0 ? _f : 0;
    const logoHeight = (_g = logoMeta.height) !== null && _g !== void 0 ? _g : 0;
    if (!logoWidth || !logoHeight) {
        return imageBuffer;
    }
    const widthLimited = width * maxLogoWidthRatio;
    const heightLimited = height * maxLogoHeightRatio;
    const scale = Math.min(widthLimited / logoWidth, heightLimited / logoHeight, 1);
    const finalLogoWidth = Math.round(logoWidth * scale);
    const finalLogoHeight = Math.round(logoHeight * scale);
    logo = logo.resize(finalLogoWidth, finalLogoHeight, { fit: "inside" });
    const compositeBuffer = await logo.toBuffer();
    const result = await base
        .composite([
        {
            input: compositeBuffer,
            gravity: "southeast",
            top: height - finalLogoHeight - padding,
            left: width - finalLogoWidth - padding,
        },
    ])
        .jpeg({ quality: 80 })
        .toBuffer();
    return result;
}
