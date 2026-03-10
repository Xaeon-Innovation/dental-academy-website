"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
var admin_1 = require("@/lib/firebase/admin");
var imageWatermark_1 = require("@/lib/imageWatermark");
var blob_1 = require("@vercel/blob");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var db, snapshot, _i, _a, doc, data, images, updatedUrls, _b, images_1, url, res, arrayBuffer, originalBuffer, watermarkedBuffer, urlObj, pathParts, fileName, wmName, pathname, blob, err_1;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    db = (0, admin_1.getAdminDb)();
                    if (!db) {
                        console.error("Admin Firestore is not configured. Configure FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 before running this script.");
                        process.exit(1);
                    }
                    if (!process.env.BLOB_READ_WRITE_TOKEN) {
                        console.error("BLOB_READ_WRITE_TOKEN is required to upload watermarked images to Vercel Blob.");
                        process.exit(1);
                    }
                    return [4 /*yield*/, db.collection("cases").get()];
                case 1:
                    snapshot = _d.sent();
                    console.log("Found ".concat(snapshot.size, " cases"));
                    _i = 0, _a = snapshot.docs;
                    _d.label = 2;
                case 2:
                    if (!(_i < _a.length)) return [3 /*break*/, 14];
                    doc = _a[_i];
                    data = doc.data();
                    images = data.images || [];
                    if (!Array.isArray(images) || images.length === 0)
                        return [3 /*break*/, 13];
                    updatedUrls = [];
                    _b = 0, images_1 = images;
                    _d.label = 3;
                case 3:
                    if (!(_b < images_1.length)) return [3 /*break*/, 11];
                    url = images_1[_b];
                    _d.label = 4;
                case 4:
                    _d.trys.push([4, 9, , 10]);
                    if (typeof url !== "string" || !url) {
                        updatedUrls.push(url);
                        return [3 /*break*/, 10];
                    }
                    if (url.includes("-wm.")) {
                        updatedUrls.push(url);
                        return [3 /*break*/, 10];
                    }
                    console.log("Watermarking image for case ".concat(doc.id, ": ").concat(url));
                    return [4 /*yield*/, fetch(url)];
                case 5:
                    res = _d.sent();
                    if (!res.ok) {
                        console.warn("Failed to fetch ".concat(url, ": ").concat(res.status, " ").concat(res.statusText));
                        updatedUrls.push(url);
                        return [3 /*break*/, 10];
                    }
                    return [4 /*yield*/, res.arrayBuffer()];
                case 6:
                    arrayBuffer = _d.sent();
                    originalBuffer = Buffer.from(arrayBuffer);
                    return [4 /*yield*/, (0, imageWatermark_1.addLogoWatermark)(originalBuffer)];
                case 7:
                    watermarkedBuffer = _d.sent();
                    urlObj = new URL(url);
                    pathParts = urlObj.pathname.split("/").filter(Boolean);
                    fileName = (_c = pathParts[pathParts.length - 1]) !== null && _c !== void 0 ? _c : "case_".concat(Date.now(), ".jpg");
                    wmName = fileName.replace(/\.(jpg|jpeg|png|webp)$/i, "-wm.jpg");
                    pathname = "cases/".concat(wmName);
                    return [4 /*yield*/, (0, blob_1.put)(pathname, watermarkedBuffer, {
                            access: "public",
                            addRandomSuffix: true,
                        })];
                case 8:
                    blob = _d.sent();
                    updatedUrls.push(blob.url);
                    return [3 /*break*/, 10];
                case 9:
                    err_1 = _d.sent();
                    console.error("Error processing image ".concat(url, " for case ").concat(doc.id, ":"), err_1);
                    updatedUrls.push(url);
                    return [3 /*break*/, 10];
                case 10:
                    _b++;
                    return [3 /*break*/, 3];
                case 11: return [4 /*yield*/, doc.ref.update({ images: updatedUrls })];
                case 12:
                    _d.sent();
                    _d.label = 13;
                case 13:
                    _i++;
                    return [3 /*break*/, 2];
                case 14:
                    console.log("Watermark migration completed.");
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (err) {
    console.error(err);
    process.exit(1);
});
