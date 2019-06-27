"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
exports.__esModule = true;
var message_js_1 = require("./message.js");
var dml_db_js_1 = require("./dml_db.js");
var data_manager_js_1 = require("./data_manager.js");
var tfjs_1 = require("@tensorflow/tfjs");
var Runner = /** @class */ (function () {
    function Runner() {
    }
    Runner._lowerCaseToCamelCase = function (str) {
        return str.replace(/_([a-z])/g, function (g) { return g[1].toUpperCase(); });
    };
    Runner._compileModel = function (model, optimization_data) {
        var optimizer;
        if (optimization_data['optimizer_config']['class_name'] == 'SGD') {
            // SGD
            optimizer = tfjs_1.train.sgd(optimization_data['optimizer_config']['config']['lr']);
        }
        else {
            // Not supported!
            throw "Optimizer not supported!";
        }
        model.compile({
            optimizer: optimizer,
            loss: Runner._lowerCaseToCamelCase(optimization_data['loss']),
            metrics: optimization_data['metrics']
        });
        console.log("Model compiled!", model);
        return model;
    };
    Runner._getModel = function (request, callback) {
        return __awaiter(this, void 0, void 0, function () {
            var model_url, model;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        model_url = data_manager_js_1.DataManager.cloud_url + "/model/model.json";
                        return [4 /*yield*/, tfjs_1.loadLayersModel(model_url)];
                    case 1:
                        model = _a.sent();
                        fetch(model_url)
                            .then(function (res) { return res.json(); })
                            .then(function (out) {
                            console.log('Output: ', out);
                            model = Runner._compileModel(model, out["modelTopology"]["training_config"]);
                            Runner._saveModel(model, request.id);
                            dml_db_js_1.DMLDB._get(request, callback, model);
                        })["catch"](function (err) { return console.error(err); });
                        return [2 /*return*/];
                }
            });
        });
    };
    Runner._saveModel = function (model, path) {
        return __awaiter(this, void 0, void 0, function () {
            var results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, model.save('indexeddb://' + path)];
                    case 1:
                        results = _a.sent();
                        console.log("Model saved into IndexedDB! Metadata: ", results);
                        return [2 /*return*/, results];
                }
            });
        });
    };
    Runner._getWeights = function (model) {
        return __awaiter(this, void 0, void 0, function () {
            var all_weights, i, weights, weightsData, weightsList, j;
            return __generator(this, function (_a) {
                all_weights = [];
                for (i = 0; i < model.layers.length * 2; i++) {
                    weights = model.getWeights()[i];
                    weightsData = weights.dataSync();
                    weightsList = Array.from(weightsData);
                    for (j = 0; j < weightsList.length; j++) {
                        all_weights.push(weightsList[j]);
                    }
                }
                return [2 /*return*/, all_weights];
            });
        });
    };
    Runner._labelData = function (data, label_index) {
        if (label_index < 0) {
            label_index = data[0].length - 1;
        }
        var trainXs = data;
        var trainYs = trainXs.map(function (row) { return row[label_index]; });
        trainXs.forEach(function (x) { x.splice(label_index, 1); });
        return [tfjs_1.tensor(trainXs), tfjs_1.tensor(trainYs)];
    };
    Runner._train = function (data, request, model) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, data_x, data_y, weights, results;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = Runner._labelData(data.arraySync(), request.params.label_index), data_x = _a[0], data_y = _a[1];
                        model.fit(data_x, data_y, {
                            batchSize: request.params["batch_size"],
                            epochs: request.params["epochs"],
                            shuffle: request.params["shuffle"]
                        });
                        console.log("Finished training!");
                        return [4 /*yield*/, Runner._saveModel(model, request.id)];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, Runner._getWeights(model)];
                    case 2:
                        weights = _b.sent();
                        results = {
                            "weights": weights,
                            "omega": data.arraySync().length
                        };
                        console.log("Training results:");
                        console.log(results);
                        dml_db_js_1.DMLDB._put(request, Runner._sendMessage, results);
                        return [2 /*return*/];
                }
            });
        });
    };
    Runner._evaluate = function (data, request, model) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, data_x, data_y, result;
            return __generator(this, function (_b) {
                _a = Runner._labelData(data.arraySync(), request.params.label_index), data_x = _a[0], data_y = _a[1];
                result = model.evaluate(data_x, data_y).toString();
                dml_db_js_1.DMLDB._put(request, Runner._sendMessage, result);
                return [2 /*return*/];
            });
        });
    };
    Runner._sendMessage = function (request, message) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                result = message_js_1.DMLRequest._serialize(request, message);
                data_manager_js_1.DataManager.ws.send(result);
                return [2 /*return*/];
            });
        });
    };
    Runner._handleMessage = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var callback;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        callback = (request.action == 'TRAIN') ? Runner._train : Runner._evaluate;
                        return [4 /*yield*/, Runner._getModel(request, callback)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return Runner;
}());
exports.Runner = Runner;
