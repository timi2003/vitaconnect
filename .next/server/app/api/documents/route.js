"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/documents/route";
exports.ids = ["app/api/documents/route"];
exports.modules = {

/***/ "@aws-sdk/client-s3":
/*!*************************************!*\
  !*** external "@aws-sdk/client-s3" ***!
  \*************************************/
/***/ ((module) => {

module.exports = require("@aws-sdk/client-s3");

/***/ }),

/***/ "@prisma/client":
/*!*********************************!*\
  !*** external "@prisma/client" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),

/***/ "../../client/components/action-async-storage.external":
/*!*******************************************************************************!*\
  !*** external "next/dist/client/components/action-async-storage.external.js" ***!
  \*******************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/action-async-storage.external.js");

/***/ }),

/***/ "../../client/components/request-async-storage.external":
/*!********************************************************************************!*\
  !*** external "next/dist/client/components/request-async-storage.external.js" ***!
  \********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/request-async-storage.external.js");

/***/ }),

/***/ "../../client/components/static-generation-async-storage.external":
/*!******************************************************************************************!*\
  !*** external "next/dist/client/components/static-generation-async-storage.external.js" ***!
  \******************************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/static-generation-async-storage.external.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "assert":
/*!*************************!*\
  !*** external "assert" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("assert");

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("buffer");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("events");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ "querystring":
/*!******************************!*\
  !*** external "querystring" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("querystring");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("util");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("zlib");

/***/ }),

/***/ "node:fs/promises":
/*!***********************************!*\
  !*** external "node:fs/promises" ***!
  \***********************************/
/***/ ((module) => {

module.exports = require("node:fs/promises");

/***/ }),

/***/ "node:os":
/*!**************************!*\
  !*** external "node:os" ***!
  \**************************/
/***/ ((module) => {

module.exports = require("node:os");

/***/ }),

/***/ "node:path":
/*!****************************!*\
  !*** external "node:path" ***!
  \****************************/
/***/ ((module) => {

module.exports = require("node:path");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fdocuments%2Froute&page=%2Fapi%2Fdocuments%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fdocuments%2Froute.ts&appDir=C%3A%5CUsers%5CPC%5CDownloads%5Cvitaconnect%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CPC%5CDownloads%5Cvitaconnect&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!*********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fdocuments%2Froute&page=%2Fapi%2Fdocuments%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fdocuments%2Froute.ts&appDir=C%3A%5CUsers%5CPC%5CDownloads%5Cvitaconnect%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CPC%5CDownloads%5Cvitaconnect&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \*********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_Users_PC_Downloads_vitaconnect_app_api_documents_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/documents/route.ts */ \"(rsc)/./app/api/documents/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/documents/route\",\n        pathname: \"/api/documents\",\n        filename: \"route\",\n        bundlePath: \"app/api/documents/route\"\n    },\n    resolvedPagePath: \"C:\\\\Users\\\\PC\\\\Downloads\\\\vitaconnect\\\\app\\\\api\\\\documents\\\\route.ts\",\n    nextConfigOutput,\n    userland: C_Users_PC_Downloads_vitaconnect_app_api_documents_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/documents/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZkb2N1bWVudHMlMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRmRvY3VtZW50cyUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRmRvY3VtZW50cyUyRnJvdXRlLnRzJmFwcERpcj1DJTNBJTVDVXNlcnMlNUNQQyU1Q0Rvd25sb2FkcyU1Q3ZpdGFjb25uZWN0JTVDYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj1DJTNBJTVDVXNlcnMlNUNQQyU1Q0Rvd25sb2FkcyU1Q3ZpdGFjb25uZWN0JmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PSZwcmVmZXJyZWRSZWdpb249Jm1pZGRsZXdhcmVDb25maWc9ZTMwJTNEISIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBc0c7QUFDdkM7QUFDYztBQUNvQjtBQUNqRztBQUNBO0FBQ0E7QUFDQSx3QkFBd0IsZ0hBQW1CO0FBQzNDO0FBQ0EsY0FBYyx5RUFBUztBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsWUFBWTtBQUNaLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQSxRQUFRLGlFQUFpRTtBQUN6RTtBQUNBO0FBQ0EsV0FBVyw0RUFBVztBQUN0QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ3VIOztBQUV2SCIsInNvdXJjZXMiOlsid2VicGFjazovL3ZpdGFjb25uZWN0LXRlbGVoZWFsdGgvP2JkN2IiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwUm91dGVSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2Z1dHVyZS9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2Z1dHVyZS9yb3V0ZS1raW5kXCI7XG5pbXBvcnQgeyBwYXRjaEZldGNoIGFzIF9wYXRjaEZldGNoIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvbGliL3BhdGNoLWZldGNoXCI7XG5pbXBvcnQgKiBhcyB1c2VybGFuZCBmcm9tIFwiQzpcXFxcVXNlcnNcXFxcUENcXFxcRG93bmxvYWRzXFxcXHZpdGFjb25uZWN0XFxcXGFwcFxcXFxhcGlcXFxcZG9jdW1lbnRzXFxcXHJvdXRlLnRzXCI7XG4vLyBXZSBpbmplY3QgdGhlIG5leHRDb25maWdPdXRwdXQgaGVyZSBzbyB0aGF0IHdlIGNhbiB1c2UgdGhlbSBpbiB0aGUgcm91dGVcbi8vIG1vZHVsZS5cbmNvbnN0IG5leHRDb25maWdPdXRwdXQgPSBcIlwiXG5jb25zdCByb3V0ZU1vZHVsZSA9IG5ldyBBcHBSb3V0ZVJvdXRlTW9kdWxlKHtcbiAgICBkZWZpbml0aW9uOiB7XG4gICAgICAgIGtpbmQ6IFJvdXRlS2luZC5BUFBfUk9VVEUsXG4gICAgICAgIHBhZ2U6IFwiL2FwaS9kb2N1bWVudHMvcm91dGVcIixcbiAgICAgICAgcGF0aG5hbWU6IFwiL2FwaS9kb2N1bWVudHNcIixcbiAgICAgICAgZmlsZW5hbWU6IFwicm91dGVcIixcbiAgICAgICAgYnVuZGxlUGF0aDogXCJhcHAvYXBpL2RvY3VtZW50cy9yb3V0ZVwiXG4gICAgfSxcbiAgICByZXNvbHZlZFBhZ2VQYXRoOiBcIkM6XFxcXFVzZXJzXFxcXFBDXFxcXERvd25sb2Fkc1xcXFx2aXRhY29ubmVjdFxcXFxhcHBcXFxcYXBpXFxcXGRvY3VtZW50c1xcXFxyb3V0ZS50c1wiLFxuICAgIG5leHRDb25maWdPdXRwdXQsXG4gICAgdXNlcmxhbmRcbn0pO1xuLy8gUHVsbCBvdXQgdGhlIGV4cG9ydHMgdGhhdCB3ZSBuZWVkIHRvIGV4cG9zZSBmcm9tIHRoZSBtb2R1bGUuIFRoaXMgc2hvdWxkXG4vLyBiZSBlbGltaW5hdGVkIHdoZW4gd2UndmUgbW92ZWQgdGhlIG90aGVyIHJvdXRlcyB0byB0aGUgbmV3IGZvcm1hdC4gVGhlc2Vcbi8vIGFyZSB1c2VkIHRvIGhvb2sgaW50byB0aGUgcm91dGUuXG5jb25zdCB7IHJlcXVlc3RBc3luY1N0b3JhZ2UsIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzIH0gPSByb3V0ZU1vZHVsZTtcbmNvbnN0IG9yaWdpbmFsUGF0aG5hbWUgPSBcIi9hcGkvZG9jdW1lbnRzL3JvdXRlXCI7XG5mdW5jdGlvbiBwYXRjaEZldGNoKCkge1xuICAgIHJldHVybiBfcGF0Y2hGZXRjaCh7XG4gICAgICAgIHNlcnZlckhvb2tzLFxuICAgICAgICBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlXG4gICAgfSk7XG59XG5leHBvcnQgeyByb3V0ZU1vZHVsZSwgcmVxdWVzdEFzeW5jU3RvcmFnZSwgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MsIG9yaWdpbmFsUGF0aG5hbWUsIHBhdGNoRmV0Y2gsICB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1hcHAtcm91dGUuanMubWFwIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fdocuments%2Froute&page=%2Fapi%2Fdocuments%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fdocuments%2Froute.ts&appDir=C%3A%5CUsers%5CPC%5CDownloads%5Cvitaconnect%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CPC%5CDownloads%5Cvitaconnect&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./app/api/documents/route.ts":
/*!************************************!*\
  !*** ./app/api/documents/route.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   DELETE: () => (/* binding */ DELETE),\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next-auth */ \"(rsc)/./node_modules/next-auth/index.js\");\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_auth__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _lib_auth__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/lib/auth */ \"(rsc)/./lib/auth.ts\");\n/* harmony import */ var _lib_prisma__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @/lib/prisma */ \"(rsc)/./lib/prisma.ts\");\n/* harmony import */ var _aws_sdk_client_s3__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @aws-sdk/client-s3 */ \"@aws-sdk/client-s3\");\n/* harmony import */ var _aws_sdk_client_s3__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_aws_sdk_client_s3__WEBPACK_IMPORTED_MODULE_4__);\n/* harmony import */ var _aws_sdk_s3_request_presigner__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @aws-sdk/s3-request-presigner */ \"(rsc)/./node_modules/@aws-sdk/s3-request-presigner/dist-es/getSignedUrl.js\");\n\n\n\n\n// ── OPTION B: R2 re-signing ───────────────────────────────────────────────\n\n\nconst r2 = new _aws_sdk_client_s3__WEBPACK_IMPORTED_MODULE_4__.S3Client({\n    region: \"auto\",\n    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,\n    credentials: {\n        accessKeyId: process.env.R2_ACCESS_KEY_ID,\n        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY\n    }\n});\nasync function freshUrl(storagePath) {\n    return (0,_aws_sdk_s3_request_presigner__WEBPACK_IMPORTED_MODULE_5__.getSignedUrl)(r2, new _aws_sdk_client_s3__WEBPACK_IMPORTED_MODULE_4__.GetObjectCommand({\n        Bucket: process.env.R2_BUCKET_NAME,\n        Key: storagePath\n    }), {\n        expiresIn: 60 * 60 * 2\n    } // 2-hour URL served to the browser\n    );\n}\n// ─────────────────────────────────────────────────────────────────────────\nasync function GET(req) {\n    const session = await (0,next_auth__WEBPACK_IMPORTED_MODULE_1__.getServerSession)(_lib_auth__WEBPACK_IMPORTED_MODULE_2__.authOptions);\n    if (!session?.user?.id) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"Unauthorized\"\n        }, {\n            status: 401\n        });\n    }\n    const { searchParams } = new URL(req.url);\n    const type = searchParams.get(\"type\");\n    const documents = await _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.medicalDocument.findMany({\n        where: {\n            userId: session.user.id,\n            ...type ? {\n                type\n            } : {}\n        },\n        orderBy: {\n            createdAt: \"desc\"\n        },\n        take: 100\n    });\n    // Re-sign every URL so browser links are always fresh\n    // description field stores the raw R2 key (set during upload)\n    const refreshed = await Promise.allSettled(documents.map(async (doc)=>{\n        if (!doc.description) return doc;\n        try {\n            const url = await freshUrl(doc.description);\n            return {\n                ...doc,\n                fileUrl: url\n            };\n        } catch  {\n            return doc; // return stale URL rather than crashing\n        }\n    }));\n    const result = refreshed.map((r)=>r.status === \"fulfilled\" ? r.value : null).filter(Boolean);\n    return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        documents: result\n    });\n}\nasync function DELETE(req) {\n    const session = await (0,next_auth__WEBPACK_IMPORTED_MODULE_1__.getServerSession)(_lib_auth__WEBPACK_IMPORTED_MODULE_2__.authOptions);\n    if (!session?.user?.id) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"Unauthorized\"\n        }, {\n            status: 401\n        });\n    }\n    const { searchParams } = new URL(req.url);\n    const id = searchParams.get(\"id\");\n    if (!id) return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        error: \"Missing id\"\n    }, {\n        status: 400\n    });\n    const doc = await _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.medicalDocument.findFirst({\n        where: {\n            id,\n            userId: session.user.id\n        }\n    });\n    if (!doc) return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        error: \"Not found\"\n    }, {\n        status: 404\n    });\n    // Delete from R2 first\n    if (doc.description) {\n        try {\n            const { DeleteObjectCommand } = await Promise.resolve(/*! import() */).then(__webpack_require__.t.bind(__webpack_require__, /*! @aws-sdk/client-s3 */ \"@aws-sdk/client-s3\", 23));\n            await r2.send(new DeleteObjectCommand({\n                Bucket: process.env.R2_BUCKET_NAME,\n                Key: doc.description\n            }));\n        } catch (err) {\n            console.error(\"[documents DELETE] R2 removal failed:\", err);\n        // Still delete DB row — orphaned object is better than stuck UI\n        }\n    }\n    await _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.medicalDocument.delete({\n        where: {\n            id\n        }\n    });\n    return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        deleted: true\n    });\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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RXpFLE1BQU1rQixNQUFNLE1BQU05QywrQ0FBTUEsQ0FBQ21DLGVBQWUsQ0FBQ29CLFNBQVMsQ0FBQztRQUNqRGxCLE9BQU87WUFBRVo7WUFBSWEsUUFBUWYsUUFBUUMsSUFBSSxDQUFDQyxFQUFFO1FBQUM7SUFDdkM7SUFDQSxJQUFJLENBQUNxQixLQUFLLE9BQU9qRCxxREFBWUEsQ0FBQzZCLElBQUksQ0FBQztRQUFFQyxPQUFPO0lBQVksR0FBRztRQUFFQyxRQUFRO0lBQUk7SUFFekUsdUJBQXVCO0lBQ3ZCLElBQUlrQixJQUFJQyxXQUFXLEVBQUU7UUFDbkIsSUFBSTtZQUNGLE1BQU0sRUFBRVMsbUJBQW1CLEVBQUUsR0FBRyxNQUFNLDBJQUE0QjtZQUNsRSxNQUFNcEQsR0FBR3FELElBQUksQ0FDWCxJQUFJRCxvQkFBb0I7Z0JBQ3RCdkMsUUFBUVYsUUFBUUMsR0FBRyxDQUFDVSxjQUFjO2dCQUNsQ0MsS0FBUTJCLElBQUlDLFdBQVc7WUFDekI7UUFFSixFQUFFLE9BQU9XLEtBQUs7WUFDWkMsUUFBUWhDLEtBQUssQ0FBQyx5Q0FBeUMrQjtRQUN2RCxnRUFBZ0U7UUFDbEU7SUFDRjtJQUVBLE1BQU0xRCwrQ0FBTUEsQ0FBQ21DLGVBQWUsQ0FBQ3lCLE1BQU0sQ0FBQztRQUFFdkIsT0FBTztZQUFFWjtRQUFHO0lBQUU7SUFDcEQsT0FBTzVCLHFEQUFZQSxDQUFDNkIsSUFBSSxDQUFDO1FBQUVtQyxTQUFTO0lBQUs7QUFDM0MiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly92aXRhY29ubmVjdC10ZWxlaGVhbHRoLy4vYXBwL2FwaS9kb2N1bWVudHMvcm91dGUudHM/NzE3ZSJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXh0UmVxdWVzdCwgTmV4dFJlc3BvbnNlIH0gZnJvbSBcIm5leHQvc2VydmVyXCI7XHJcbmltcG9ydCB7IGdldFNlcnZlclNlc3Npb24gfSBmcm9tIFwibmV4dC1hdXRoXCI7XHJcbmltcG9ydCB7IGF1dGhPcHRpb25zIH0gZnJvbSBcIkAvbGliL2F1dGhcIjtcclxuaW1wb3J0IHsgcHJpc21hIH0gZnJvbSBcIkAvbGliL3ByaXNtYVwiO1xyXG5pbXBvcnQgeyBEb2NUeXBlIH0gZnJvbSBcIkBwcmlzbWEvY2xpZW50XCI7XHJcblxyXG4vLyDilIDilIAgT1BUSU9OIEI6IFIyIHJlLXNpZ25pbmcg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXHJcbmltcG9ydCB7IFMzQ2xpZW50LCBHZXRPYmplY3RDb21tYW5kIH0gZnJvbSBcIkBhd3Mtc2RrL2NsaWVudC1zM1wiO1xyXG5pbXBvcnQgeyBnZXRTaWduZWRVcmwgfSBmcm9tIFwiQGF3cy1zZGsvczMtcmVxdWVzdC1wcmVzaWduZXJcIjtcclxuXHJcbmNvbnN0IHIyID0gbmV3IFMzQ2xpZW50KHtcclxuICByZWdpb246IFwiYXV0b1wiLFxyXG4gIGVuZHBvaW50OiBgaHR0cHM6Ly8ke3Byb2Nlc3MuZW52LlIyX0FDQ09VTlRfSUR9LnIyLmNsb3VkZmxhcmVzdG9yYWdlLmNvbWAsXHJcbiAgY3JlZGVudGlhbHM6IHtcclxuICAgIGFjY2Vzc0tleUlkOiAgICAgcHJvY2Vzcy5lbnYuUjJfQUNDRVNTX0tFWV9JRCEsXHJcbiAgICBzZWNyZXRBY2Nlc3NLZXk6IHByb2Nlc3MuZW52LlIyX1NFQ1JFVF9BQ0NFU1NfS0VZISxcclxuICB9LFxyXG59KTtcclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGZyZXNoVXJsKHN0b3JhZ2VQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xyXG4gIHJldHVybiBnZXRTaWduZWRVcmwoXHJcbiAgICByMixcclxuICAgIG5ldyBHZXRPYmplY3RDb21tYW5kKHtcclxuICAgICAgQnVja2V0OiBwcm9jZXNzLmVudi5SMl9CVUNLRVRfTkFNRSEsXHJcbiAgICAgIEtleTogICAgc3RvcmFnZVBhdGgsXHJcbiAgICB9KSxcclxuICAgIHsgZXhwaXJlc0luOiA2MCAqIDYwICogMiB9IC8vIDItaG91ciBVUkwgc2VydmVkIHRvIHRoZSBicm93c2VyXHJcbiAgKTtcclxufVxyXG4vLyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBHRVQocmVxOiBOZXh0UmVxdWVzdCkge1xyXG4gIGNvbnN0IHNlc3Npb24gPSBhd2FpdCBnZXRTZXJ2ZXJTZXNzaW9uKGF1dGhPcHRpb25zKTtcclxuICBpZiAoIXNlc3Npb24/LnVzZXI/LmlkKSB7XHJcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogXCJVbmF1dGhvcml6ZWRcIiB9LCB7IHN0YXR1czogNDAxIH0pO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgeyBzZWFyY2hQYXJhbXMgfSA9IG5ldyBVUkwocmVxLnVybCk7XHJcbiAgY29uc3QgdHlwZSA9IHNlYXJjaFBhcmFtcy5nZXQoXCJ0eXBlXCIpIGFzIERvY1R5cGUgfCBudWxsO1xyXG5cclxuICBjb25zdCBkb2N1bWVudHMgPSBhd2FpdCBwcmlzbWEubWVkaWNhbERvY3VtZW50LmZpbmRNYW55KHtcclxuICAgIHdoZXJlOiB7XHJcbiAgICAgIHVzZXJJZDogc2Vzc2lvbi51c2VyLmlkLFxyXG4gICAgICAuLi4odHlwZSA/IHsgdHlwZSB9IDoge30pLFxyXG4gICAgfSxcclxuICAgIG9yZGVyQnk6IHsgY3JlYXRlZEF0OiBcImRlc2NcIiB9LFxyXG4gICAgdGFrZTogMTAwLFxyXG4gIH0pO1xyXG5cclxuICAvLyBSZS1zaWduIGV2ZXJ5IFVSTCBzbyBicm93c2VyIGxpbmtzIGFyZSBhbHdheXMgZnJlc2hcclxuICAvLyBkZXNjcmlwdGlvbiBmaWVsZCBzdG9yZXMgdGhlIHJhdyBSMiBrZXkgKHNldCBkdXJpbmcgdXBsb2FkKVxyXG4gIGNvbnN0IHJlZnJlc2hlZCA9IGF3YWl0IFByb21pc2UuYWxsU2V0dGxlZChcclxuICAgIGRvY3VtZW50cy5tYXAoYXN5bmMgKGRvYykgPT4ge1xyXG4gICAgICBpZiAoIWRvYy5kZXNjcmlwdGlvbikgcmV0dXJuIGRvYztcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCB1cmwgPSBhd2FpdCBmcmVzaFVybChkb2MuZGVzY3JpcHRpb24pO1xyXG4gICAgICAgIHJldHVybiB7IC4uLmRvYywgZmlsZVVybDogdXJsIH07XHJcbiAgICAgIH0gY2F0Y2gge1xyXG4gICAgICAgIHJldHVybiBkb2M7IC8vIHJldHVybiBzdGFsZSBVUkwgcmF0aGVyIHRoYW4gY3Jhc2hpbmdcclxuICAgICAgfVxyXG4gICAgfSlcclxuICApO1xyXG5cclxuICBjb25zdCByZXN1bHQgPSByZWZyZXNoZWQubWFwKChyKSA9PlxyXG4gICAgci5zdGF0dXMgPT09IFwiZnVsZmlsbGVkXCIgPyByLnZhbHVlIDogbnVsbFxyXG4gICkuZmlsdGVyKEJvb2xlYW4pO1xyXG5cclxuICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBkb2N1bWVudHM6IHJlc3VsdCB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIERFTEVURShyZXE6IE5leHRSZXF1ZXN0KSB7XHJcbiAgY29uc3Qgc2Vzc2lvbiA9IGF3YWl0IGdldFNlcnZlclNlc3Npb24oYXV0aE9wdGlvbnMpO1xyXG4gIGlmICghc2Vzc2lvbj8udXNlcj8uaWQpIHtcclxuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiBcIlVuYXV0aG9yaXplZFwiIH0sIHsgc3RhdHVzOiA0MDEgfSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCB7IHNlYXJjaFBhcmFtcyB9ID0gbmV3IFVSTChyZXEudXJsKTtcclxuICBjb25zdCBpZCA9IHNlYXJjaFBhcmFtcy5nZXQoXCJpZFwiKTtcclxuICBpZiAoIWlkKSByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogXCJNaXNzaW5nIGlkXCIgfSwgeyBzdGF0dXM6IDQwMCB9KTtcclxuXHJcbiAgY29uc3QgZG9jID0gYXdhaXQgcHJpc21hLm1lZGljYWxEb2N1bWVudC5maW5kRmlyc3Qoe1xyXG4gICAgd2hlcmU6IHsgaWQsIHVzZXJJZDogc2Vzc2lvbi51c2VyLmlkIH0sXHJcbiAgfSk7XHJcbiAgaWYgKCFkb2MpIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiBcIk5vdCBmb3VuZFwiIH0sIHsgc3RhdHVzOiA0MDQgfSk7XHJcblxyXG4gIC8vIERlbGV0ZSBmcm9tIFIyIGZpcnN0XHJcbiAgaWYgKGRvYy5kZXNjcmlwdGlvbikge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgeyBEZWxldGVPYmplY3RDb21tYW5kIH0gPSBhd2FpdCBpbXBvcnQoXCJAYXdzLXNkay9jbGllbnQtczNcIik7XHJcbiAgICAgIGF3YWl0IHIyLnNlbmQoXHJcbiAgICAgICAgbmV3IERlbGV0ZU9iamVjdENvbW1hbmQoe1xyXG4gICAgICAgICAgQnVja2V0OiBwcm9jZXNzLmVudi5SMl9CVUNLRVRfTkFNRSEsXHJcbiAgICAgICAgICBLZXk6ICAgIGRvYy5kZXNjcmlwdGlvbixcclxuICAgICAgICB9KVxyXG4gICAgICApO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJbZG9jdW1lbnRzIERFTEVURV0gUjIgcmVtb3ZhbCBmYWlsZWQ6XCIsIGVycik7XHJcbiAgICAgIC8vIFN0aWxsIGRlbGV0ZSBEQiByb3cg4oCUIG9ycGhhbmVkIG9iamVjdCBpcyBiZXR0ZXIgdGhhbiBzdHVjayBVSVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgYXdhaXQgcHJpc21hLm1lZGljYWxEb2N1bWVudC5kZWxldGUoeyB3aGVyZTogeyBpZCB9IH0pO1xyXG4gIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGRlbGV0ZWQ6IHRydWUgfSk7XHJcbn0iXSwibmFtZXMiOlsiTmV4dFJlc3BvbnNlIiwiZ2V0U2VydmVyU2Vzc2lvbiIsImF1dGhPcHRpb25zIiwicHJpc21hIiwiUzNDbGllbnQiLCJHZXRPYmplY3RDb21tYW5kIiwiZ2V0U2lnbmVkVXJsIiwicjIiLCJyZWdpb24iLCJlbmRwb2ludCIsInByb2Nlc3MiLCJlbnYiLCJSMl9BQ0NPVU5UX0lEIiwiY3JlZGVudGlhbHMiLCJhY2Nlc3NLZXlJZCIsIlIyX0FDQ0VTU19LRVlfSUQiLCJzZWNyZXRBY2Nlc3NLZXkiLCJSMl9TRUNSRVRfQUNDRVNTX0tFWSIsImZyZXNoVXJsIiwic3RvcmFnZVBhdGgiLCJCdWNrZXQiLCJSMl9CVUNLRVRfTkFNRSIsIktleSIsImV4cGlyZXNJbiIsIkdFVCIsInJlcSIsInNlc3Npb24iLCJ1c2VyIiwiaWQiLCJqc29uIiwiZXJyb3IiLCJzdGF0dXMiLCJzZWFyY2hQYXJhbXMiLCJVUkwiLCJ1cmwiLCJ0eXBlIiwiZ2V0IiwiZG9jdW1lbnRzIiwibWVkaWNhbERvY3VtZW50IiwiZmluZE1hbnkiLCJ3aGVyZSIsInVzZXJJZCIsIm9yZGVyQnkiLCJjcmVhdGVkQXQiLCJ0YWtlIiwicmVmcmVzaGVkIiwiUHJvbWlzZSIsImFsbFNldHRsZWQiLCJtYXAiLCJkb2MiLCJkZXNjcmlwdGlvbiIsImZpbGVVcmwiLCJyZXN1bHQiLCJyIiwidmFsdWUiLCJmaWx0ZXIiLCJCb29sZWFuIiwiREVMRVRFIiwiZmluZEZpcnN0IiwiRGVsZXRlT2JqZWN0Q29tbWFuZCIsInNlbmQiLCJlcnIiLCJjb25zb2xlIiwiZGVsZXRlIiwiZGVsZXRlZCJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./app/api/documents/route.ts\n");

/***/ }),

/***/ "(rsc)/./lib/auth.ts":
/*!*********************!*\
  !*** ./lib/auth.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   authOptions: () => (/* binding */ authOptions)\n/* harmony export */ });\n/* harmony import */ var _auth_prisma_adapter__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @auth/prisma-adapter */ \"(rsc)/./node_modules/@auth/prisma-adapter/index.js\");\n/* harmony import */ var next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next-auth/providers/credentials */ \"(rsc)/./node_modules/next-auth/providers/credentials.js\");\n/* harmony import */ var next_auth_providers_google__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next-auth/providers/google */ \"(rsc)/./node_modules/next-auth/providers/google.js\");\n/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! bcryptjs */ \"(rsc)/./node_modules/bcryptjs/index.js\");\n/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(bcryptjs__WEBPACK_IMPORTED_MODULE_3__);\n/* harmony import */ var _prisma__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./prisma */ \"(rsc)/./lib/prisma.ts\");\n// lib/auth.ts\n\n\n\n\n\nconst authOptions = {\n    adapter: (0,_auth_prisma_adapter__WEBPACK_IMPORTED_MODULE_0__.PrismaAdapter)(_prisma__WEBPACK_IMPORTED_MODULE_4__.prisma),\n    session: {\n        strategy: \"jwt\"\n    },\n    pages: {\n        signIn: \"/auth/login\",\n        // ✅ NO signUp here — NextAuth doesn't support that key.\n        // Registration is handled by /api/auth/register independently.\n        error: \"/auth/error\"\n    },\n    providers: [\n        (0,next_auth_providers_google__WEBPACK_IMPORTED_MODULE_2__[\"default\"])({\n            clientId: process.env.GOOGLE_CLIENT_ID,\n            clientSecret: process.env.GOOGLE_CLIENT_SECRET\n        }),\n        (0,next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_1__[\"default\"])({\n            name: \"credentials\",\n            credentials: {\n                email: {\n                    label: \"Email\",\n                    type: \"email\"\n                },\n                password: {\n                    label: \"Password\",\n                    type: \"password\"\n                }\n            },\n            async authorize (credentials) {\n                if (!credentials?.email || !credentials?.password) return null;\n                const user = await _prisma__WEBPACK_IMPORTED_MODULE_4__.prisma.user.findUnique({\n                    where: {\n                        email: credentials.email\n                    }\n                });\n                if (!user?.passwordHash) return null;\n                const valid = await bcryptjs__WEBPACK_IMPORTED_MODULE_3___default().compare(credentials.password, user.passwordHash);\n                if (!valid) return null;\n                return {\n                    id: user.id,\n                    email: user.email,\n                    name: user.name ?? \"\",\n                    image: user.image ?? null,\n                    role: user.role\n                };\n            }\n        })\n    ],\n    callbacks: {\n        async jwt ({ token, user }) {\n            if (user) {\n                token.id = user.id;\n                token.role = user.role ?? \"PATIENT\";\n            }\n            return token;\n        },\n        async session ({ session, token }) {\n            session.user.id = token.id;\n            session.user.role = token.role;\n            return session;\n        }\n    },\n    events: {\n        async signIn ({ user }) {\n            if (!user.id) return;\n            await _prisma__WEBPACK_IMPORTED_MODULE_4__.prisma.auditLog.create({\n                data: {\n                    userId: user.id,\n                    action: \"SIGN_IN\",\n                    resource: \"auth\"\n                }\n            });\n        }\n    }\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvYXV0aC50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsY0FBYztBQUV1QztBQUNhO0FBQ1Y7QUFDMUI7QUFDSTtBQUUzQixNQUFNSyxjQUErQjtJQUMxQ0MsU0FBU04sbUVBQWFBLENBQUNJLDJDQUFNQTtJQUM3QkcsU0FBUztRQUFFQyxVQUFVO0lBQU07SUFDM0JDLE9BQU87UUFDTEMsUUFBUTtRQUNSLHdEQUF3RDtRQUN4RCwrREFBK0Q7UUFDL0RDLE9BQVE7SUFDVjtJQUNBQyxXQUFXO1FBQ1RWLHNFQUFjQSxDQUFDO1lBQ2JXLFVBQWNDLFFBQVFDLEdBQUcsQ0FBQ0MsZ0JBQWdCO1lBQzFDQyxjQUFjSCxRQUFRQyxHQUFHLENBQUNHLG9CQUFvQjtRQUNoRDtRQUVBakIsMkVBQW1CQSxDQUFDO1lBQ2xCa0IsTUFBTTtZQUNOQyxhQUFhO2dCQUNYQyxPQUFVO29CQUFFQyxPQUFPO29CQUFZQyxNQUFNO2dCQUFRO2dCQUM3Q0MsVUFBVTtvQkFBRUYsT0FBTztvQkFBWUMsTUFBTTtnQkFBVztZQUNsRDtZQUNBLE1BQU1FLFdBQVVMLFdBQVc7Z0JBQ3pCLElBQUksQ0FBQ0EsYUFBYUMsU0FBUyxDQUFDRCxhQUFhSSxVQUFVLE9BQU87Z0JBRTFELE1BQU1FLE9BQU8sTUFBTXRCLDJDQUFNQSxDQUFDc0IsSUFBSSxDQUFDQyxVQUFVLENBQUM7b0JBQ3hDQyxPQUFPO3dCQUFFUCxPQUFPRCxZQUFZQyxLQUFLO29CQUFDO2dCQUNwQztnQkFFQSxJQUFJLENBQUNLLE1BQU1HLGNBQWMsT0FBTztnQkFFaEMsTUFBTUMsUUFBUSxNQUFNM0IsdURBQWMsQ0FBQ2lCLFlBQVlJLFFBQVEsRUFBRUUsS0FBS0csWUFBWTtnQkFDMUUsSUFBSSxDQUFDQyxPQUFPLE9BQU87Z0JBRW5CLE9BQU87b0JBQ0xFLElBQU9OLEtBQUtNLEVBQUU7b0JBQ2RYLE9BQU9LLEtBQUtMLEtBQUs7b0JBQ2pCRixNQUFPTyxLQUFLUCxJQUFJLElBQUk7b0JBQ3BCYyxPQUFPUCxLQUFLTyxLQUFLLElBQUk7b0JBQ3JCQyxNQUFPUixLQUFLUSxJQUFJO2dCQUNsQjtZQUNGO1FBQ0Y7S0FDRDtJQUVEQyxXQUFXO1FBQ1QsTUFBTUMsS0FBSSxFQUFFQyxLQUFLLEVBQUVYLElBQUksRUFBRTtZQUN2QixJQUFJQSxNQUFNO2dCQUNSVyxNQUFNTCxFQUFFLEdBQUtOLEtBQUtNLEVBQUU7Z0JBQ3BCSyxNQUFNSCxJQUFJLEdBQUcsS0FBNEJBLElBQUksSUFBSTtZQUNuRDtZQUNBLE9BQU9HO1FBQ1Q7UUFFQSxNQUFNOUIsU0FBUSxFQUFFQSxPQUFPLEVBQUU4QixLQUFLLEVBQUU7WUFDOUI5QixRQUFRbUIsSUFBSSxDQUFDTSxFQUFFLEdBQUtLLE1BQU1MLEVBQUU7WUFDNUJ6QixRQUFRbUIsSUFBSSxDQUFDUSxJQUFJLEdBQUdHLE1BQU1ILElBQUk7WUFDOUIsT0FBTzNCO1FBQ1Q7SUFDRjtJQUVBK0IsUUFBUTtRQUNOLE1BQU01QixRQUFPLEVBQUVnQixJQUFJLEVBQUU7WUFDbkIsSUFBSSxDQUFDQSxLQUFLTSxFQUFFLEVBQUU7WUFDZCxNQUFNNUIsMkNBQU1BLENBQUNtQyxRQUFRLENBQUNDLE1BQU0sQ0FBQztnQkFDM0JDLE1BQU07b0JBQ0pDLFFBQVVoQixLQUFLTSxFQUFFO29CQUNqQlcsUUFBVTtvQkFDVkMsVUFBVTtnQkFDWjtZQUNGO1FBQ0Y7SUFDRjtBQUNGLEVBQUUiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly92aXRhY29ubmVjdC10ZWxlaGVhbHRoLy4vbGliL2F1dGgudHM/YmY3ZSJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBsaWIvYXV0aC50c1xuaW1wb3J0IHsgTmV4dEF1dGhPcHRpb25zIH0gZnJvbSBcIm5leHQtYXV0aFwiO1xuaW1wb3J0IHsgUHJpc21hQWRhcHRlciB9IGZyb20gXCJAYXV0aC9wcmlzbWEtYWRhcHRlclwiO1xuaW1wb3J0IENyZWRlbnRpYWxzUHJvdmlkZXIgZnJvbSBcIm5leHQtYXV0aC9wcm92aWRlcnMvY3JlZGVudGlhbHNcIjtcbmltcG9ydCBHb29nbGVQcm92aWRlciBmcm9tIFwibmV4dC1hdXRoL3Byb3ZpZGVycy9nb29nbGVcIjtcbmltcG9ydCBiY3J5cHQgZnJvbSBcImJjcnlwdGpzXCI7XG5pbXBvcnQgeyBwcmlzbWEgfSBmcm9tIFwiLi9wcmlzbWFcIjtcblxuZXhwb3J0IGNvbnN0IGF1dGhPcHRpb25zOiBOZXh0QXV0aE9wdGlvbnMgPSB7XG4gIGFkYXB0ZXI6IFByaXNtYUFkYXB0ZXIocHJpc21hKSBhcyBuZXZlcixcbiAgc2Vzc2lvbjogeyBzdHJhdGVneTogXCJqd3RcIiB9LFxuICBwYWdlczoge1xuICAgIHNpZ25JbjogXCIvYXV0aC9sb2dpblwiLFxuICAgIC8vIOKchSBOTyBzaWduVXAgaGVyZSDigJQgTmV4dEF1dGggZG9lc24ndCBzdXBwb3J0IHRoYXQga2V5LlxuICAgIC8vIFJlZ2lzdHJhdGlvbiBpcyBoYW5kbGVkIGJ5IC9hcGkvYXV0aC9yZWdpc3RlciBpbmRlcGVuZGVudGx5LlxuICAgIGVycm9yOiAgXCIvYXV0aC9lcnJvclwiLFxuICB9LFxuICBwcm92aWRlcnM6IFtcbiAgICBHb29nbGVQcm92aWRlcih7XG4gICAgICBjbGllbnRJZDogICAgIHByb2Nlc3MuZW52LkdPT0dMRV9DTElFTlRfSUQhLFxuICAgICAgY2xpZW50U2VjcmV0OiBwcm9jZXNzLmVudi5HT09HTEVfQ0xJRU5UX1NFQ1JFVCEsXG4gICAgfSksXG5cbiAgICBDcmVkZW50aWFsc1Byb3ZpZGVyKHtcbiAgICAgIG5hbWU6IFwiY3JlZGVudGlhbHNcIixcbiAgICAgIGNyZWRlbnRpYWxzOiB7XG4gICAgICAgIGVtYWlsOiAgICB7IGxhYmVsOiBcIkVtYWlsXCIsICAgIHR5cGU6IFwiZW1haWxcIiB9LFxuICAgICAgICBwYXNzd29yZDogeyBsYWJlbDogXCJQYXNzd29yZFwiLCB0eXBlOiBcInBhc3N3b3JkXCIgfSxcbiAgICAgIH0sXG4gICAgICBhc3luYyBhdXRob3JpemUoY3JlZGVudGlhbHMpIHtcbiAgICAgICAgaWYgKCFjcmVkZW50aWFscz8uZW1haWwgfHwgIWNyZWRlbnRpYWxzPy5wYXNzd29yZCkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgY29uc3QgdXNlciA9IGF3YWl0IHByaXNtYS51c2VyLmZpbmRVbmlxdWUoe1xuICAgICAgICAgIHdoZXJlOiB7IGVtYWlsOiBjcmVkZW50aWFscy5lbWFpbCB9LFxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoIXVzZXI/LnBhc3N3b3JkSGFzaCkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgY29uc3QgdmFsaWQgPSBhd2FpdCBiY3J5cHQuY29tcGFyZShjcmVkZW50aWFscy5wYXNzd29yZCwgdXNlci5wYXNzd29yZEhhc2gpO1xuICAgICAgICBpZiAoIXZhbGlkKSByZXR1cm4gbnVsbDtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGlkOiAgICB1c2VyLmlkLFxuICAgICAgICAgIGVtYWlsOiB1c2VyLmVtYWlsLFxuICAgICAgICAgIG5hbWU6ICB1c2VyLm5hbWUgPz8gXCJcIixcbiAgICAgICAgICBpbWFnZTogdXNlci5pbWFnZSA/PyBudWxsLFxuICAgICAgICAgIHJvbGU6ICB1c2VyLnJvbGUsXG4gICAgICAgIH07XG4gICAgICB9LFxuICAgIH0pLFxuICBdLFxuXG4gIGNhbGxiYWNrczoge1xuICAgIGFzeW5jIGp3dCh7IHRva2VuLCB1c2VyIH0pIHtcbiAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgIHRva2VuLmlkICAgPSB1c2VyLmlkO1xuICAgICAgICB0b2tlbi5yb2xlID0gKHVzZXIgYXMgeyByb2xlPzogc3RyaW5nIH0pLnJvbGUgPz8gXCJQQVRJRU5UXCI7XG4gICAgICB9XG4gICAgICByZXR1cm4gdG9rZW47XG4gICAgfSxcblxuICAgIGFzeW5jIHNlc3Npb24oeyBzZXNzaW9uLCB0b2tlbiB9KSB7XG4gICAgICBzZXNzaW9uLnVzZXIuaWQgICA9IHRva2VuLmlkICAgYXMgc3RyaW5nO1xuICAgICAgc2Vzc2lvbi51c2VyLnJvbGUgPSB0b2tlbi5yb2xlIGFzIHN0cmluZztcbiAgICAgIHJldHVybiBzZXNzaW9uO1xuICAgIH0sXG4gIH0sXG5cbiAgZXZlbnRzOiB7XG4gICAgYXN5bmMgc2lnbkluKHsgdXNlciB9KSB7XG4gICAgICBpZiAoIXVzZXIuaWQpIHJldHVybjtcbiAgICAgIGF3YWl0IHByaXNtYS5hdWRpdExvZy5jcmVhdGUoe1xuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgdXNlcklkOiAgIHVzZXIuaWQsXG4gICAgICAgICAgYWN0aW9uOiAgIFwiU0lHTl9JTlwiLFxuICAgICAgICAgIHJlc291cmNlOiBcImF1dGhcIixcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH0sXG4gIH0sXG59OyJdLCJuYW1lcyI6WyJQcmlzbWFBZGFwdGVyIiwiQ3JlZGVudGlhbHNQcm92aWRlciIsIkdvb2dsZVByb3ZpZGVyIiwiYmNyeXB0IiwicHJpc21hIiwiYXV0aE9wdGlvbnMiLCJhZGFwdGVyIiwic2Vzc2lvbiIsInN0cmF0ZWd5IiwicGFnZXMiLCJzaWduSW4iLCJlcnJvciIsInByb3ZpZGVycyIsImNsaWVudElkIiwicHJvY2VzcyIsImVudiIsIkdPT0dMRV9DTElFTlRfSUQiLCJjbGllbnRTZWNyZXQiLCJHT09HTEVfQ0xJRU5UX1NFQ1JFVCIsIm5hbWUiLCJjcmVkZW50aWFscyIsImVtYWlsIiwibGFiZWwiLCJ0eXBlIiwicGFzc3dvcmQiLCJhdXRob3JpemUiLCJ1c2VyIiwiZmluZFVuaXF1ZSIsIndoZXJlIiwicGFzc3dvcmRIYXNoIiwidmFsaWQiLCJjb21wYXJlIiwiaWQiLCJpbWFnZSIsInJvbGUiLCJjYWxsYmFja3MiLCJqd3QiLCJ0b2tlbiIsImV2ZW50cyIsImF1ZGl0TG9nIiwiY3JlYXRlIiwiZGF0YSIsInVzZXJJZCIsImFjdGlvbiIsInJlc291cmNlIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./lib/auth.ts\n");

/***/ }),

/***/ "(rsc)/./lib/prisma.ts":
/*!***********************!*\
  !*** ./lib/prisma.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   prisma: () => (/* binding */ prisma)\n/* harmony export */ });\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @prisma/client */ \"@prisma/client\");\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_prisma_client__WEBPACK_IMPORTED_MODULE_0__);\n// lib/prisma.ts\n\nconst globalForPrisma = globalThis;\nconst prisma = globalForPrisma.prisma ?? new _prisma_client__WEBPACK_IMPORTED_MODULE_0__.PrismaClient({\n    log:  true ? [\n        \"query\",\n        \"error\",\n        \"warn\"\n    ] : 0\n});\nif (true) {\n    globalForPrisma.prisma = prisma;\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvcHJpc21hLnRzIiwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGdCQUFnQjtBQUM4QjtBQUU5QyxNQUFNQyxrQkFBa0JDO0FBRWpCLE1BQU1DLFNBQ1hGLGdCQUFnQkUsTUFBTSxJQUN0QixJQUFJSCx3REFBWUEsQ0FBQztJQUNmSSxLQUFLQyxLQUFzQyxHQUN2QztRQUFDO1FBQVM7UUFBUztLQUFPLEdBQzFCLENBQVM7QUFDZixHQUFHO0FBRUwsSUFBSUEsSUFBcUMsRUFBRTtJQUN6Q0osZ0JBQWdCRSxNQUFNLEdBQUdBO0FBQzNCIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vdml0YWNvbm5lY3QtdGVsZWhlYWx0aC8uL2xpYi9wcmlzbWEudHM/OTgyMiJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBsaWIvcHJpc21hLnRzXG5pbXBvcnQgeyBQcmlzbWFDbGllbnQgfSBmcm9tIFwiQHByaXNtYS9jbGllbnRcIjtcblxuY29uc3QgZ2xvYmFsRm9yUHJpc21hID0gZ2xvYmFsVGhpcyBhcyB1bmtub3duIGFzIHsgcHJpc21hPzogUHJpc21hQ2xpZW50IH07XG5cbmV4cG9ydCBjb25zdCBwcmlzbWEgPVxuICBnbG9iYWxGb3JQcmlzbWEucHJpc21hID8/XG4gIG5ldyBQcmlzbWFDbGllbnQoe1xuICAgIGxvZzogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09IFwiZGV2ZWxvcG1lbnRcIlxuICAgICAgPyBbXCJxdWVyeVwiLCBcImVycm9yXCIsIFwid2FyblwiXVxuICAgICAgOiBbXCJlcnJvclwiXSxcbiAgfSk7XG5cbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHsgXG4gIGdsb2JhbEZvclByaXNtYS5wcmlzbWEgPSBwcmlzbWE7XG59XG4iXSwibmFtZXMiOlsiUHJpc21hQ2xpZW50IiwiZ2xvYmFsRm9yUHJpc21hIiwiZ2xvYmFsVGhpcyIsInByaXNtYSIsImxvZyIsInByb2Nlc3MiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./lib/prisma.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/next-auth","vendor-chunks/@babel","vendor-chunks/openid-client","vendor-chunks/bcryptjs","vendor-chunks/oauth","vendor-chunks/object-hash","vendor-chunks/preact","vendor-chunks/uuid","vendor-chunks/yallist","vendor-chunks/lru-cache","vendor-chunks/cookie","vendor-chunks/@auth","vendor-chunks/oidc-token-hash","vendor-chunks/@panva","vendor-chunks/@smithy","vendor-chunks/@aws-sdk"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fdocuments%2Froute&page=%2Fapi%2Fdocuments%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fdocuments%2Froute.ts&appDir=C%3A%5CUsers%5CPC%5CDownloads%5Cvitaconnect%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CPC%5CDownloads%5Cvitaconnect&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();