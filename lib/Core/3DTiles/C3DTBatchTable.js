"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _Utf8Decoder = _interopRequireDefault(require("../../Utils/Utf8Decoder"));

var _BinaryPropertyAccessor = _interopRequireDefault(require("./utils/BinaryPropertyAccessor"));

var _C3DTilesTypes = _interopRequireDefault(require("./C3DTilesTypes"));

/** @classdesc
 * A 3D Tiles
 * [batch
 * table](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification/TileFormats/BatchTable).
 * @property {C3DTilesTypes} type - Used by 3D Tiles extensions
 * (e.g. {@link C3DTBatchTableHierarchyExtension}) to know in which context
 * (i.e. for which 3D Tiles class) the parsing of the extension should be done.
 * @property {number} batchLength - the length of the batch.
 * @property {object} content - the content of the batch table in the form:
 * {property1: values[], property2: values[], ...}.
 * @property {object} extensions - 3D Tiles extensions of the batch table
 * stored in the following format:
 * {extensioName1: extensionObject1, extensioName2: extensionObject2, ...}
 */
var C3DTBatchTable = /*#__PURE__*/function () {
  /**
   * @param {ArrayBuffer} buffer - batch table buffer to parse
   * @param {number} jsonLength - batch table json part length
  * @param {number} binaryLength - batch table binary part length
   * @param {number} batchLength - the length of the batch.
   * @param {Object} registeredExtensions - extensions registered to the layer
   */
  function C3DTBatchTable(buffer, jsonLength, binaryLength, batchLength, registeredExtensions) {
    (0, _classCallCheck2["default"])(this, C3DTBatchTable);

    if (arguments.length === 4 && (0, _typeof2["default"])(batchLength) === 'object' && !Array.isArray(batchLength) && batchLength !== null) {
      console.warn('You most likely used a deprecated constructor of C3DTBatchTable.');
    }

    if (jsonLength + binaryLength !== buffer.byteLength) {
      console.error('3DTiles batch table json length and binary length are not consistent with total buffer' + ' length. The batch table may be wrong.');
    }

    this.type = _C3DTilesTypes["default"].batchtable;
    this.batchLength = batchLength;
    var jsonBuffer = buffer.slice(0, jsonLength);
    var jsonContent = JSON.parse(_Utf8Decoder["default"].decode(new Uint8Array(jsonBuffer)));

    if (binaryLength > 0) {
      var binaryBuffer = buffer.slice(jsonLength, jsonLength + binaryLength);

      for (var propKey in jsonContent) {
        if (!Object.prototype.hasOwnProperty.call(jsonContent, propKey)) {
          continue;
        }

        var propVal = jsonContent[propKey]; // Batch table entries that have already been parsed from the JSON buffer have an array of values.

        if (Array.isArray(propVal)) {
          continue;
        }

        if (typeof (propVal === null || propVal === void 0 ? void 0 : propVal.byteOffset) !== 'undefined' && typeof (propVal === null || propVal === void 0 ? void 0 : propVal.componentType) !== 'undefined' && typeof (propVal === null || propVal === void 0 ? void 0 : propVal.type) !== 'undefined') {
          jsonContent[propKey] = (0, _BinaryPropertyAccessor["default"])(binaryBuffer, this.batchLength, propVal.byteOffset, propVal.componentType, propVal.type);
        } else {
          console.error('Invalid 3D Tiles batch table property that is neither a JSON array nor a valid ' + 'accessor to a binary body');
        }
      }
    } // Separate the content and the possible extensions
    // When an extension is found, we call its parser and append the
    // returned object to batchTable.extensions
    // Extensions must be registered in the layer (see an example of this in
    // 3dtiles_hierarchy.html)


    if (jsonContent.extensions) {
      this.extensions = registeredExtensions.parseExtensions(jsonContent.extensions, this.type);
      delete jsonContent.extensions;
    } // Store batch table json content


    this.content = jsonContent;
  }
  /**
   * Creates and returns a javascript object holding the displayable
   * information from the batch table and from extensions of the batch table,
   * for a given feature (identified with its batchID).
   * @param {integer} batchID - id of the feature
   * @returns {Object} - displayable information relative to the batch
   * table and its extensions. Object is formatted as follow:
   * {batchTable:
   *      {property1: value1
   *       property2: value2
   *       ...}
   *  extensions:
   *      {extension1:
   *          {property1: value1
   *           ...}
   *        extension2: {...}
   *        ...}
   * }
   */


  (0, _createClass2["default"])(C3DTBatchTable, [{
    key: "getInfoById",
    value: function getInfoById(batchID) {
      // Verify that the batch ID is valid
      if (batchID < 0 && batchID < this.batchLength) {
        throw new Error("Batch Id (".concat(batchID, ") must be between 0 and\n            ").concat(this.batchLength, " to access feature properties from the batch\n            table."));
      }

      var featureDisplayableInfo = {};
      featureDisplayableInfo.batchTable = {}; // Get properties from batch table content

      for (var property in this.content) {
        // check that the property is not inherited from prototype chain
        if (Object.prototype.hasOwnProperty.call(this.content, property)) {
          var val = this.content[property][batchID]; // Property value may be a threejs vector (see 3D Tiles spec and BinaryPropertyAccessor.js)

          if (val && (val.isVector2 || val.isVector3 || val.isVector4)) {
            featureDisplayableInfo.batchTable[property] = val.toArray();
          } else {
            featureDisplayableInfo.batchTable[property] = val;
          }
        }
      } // Extensions


      if (this.extensions) {
        featureDisplayableInfo.extensions = {};

        for (var extName in this.extensions) {
          if (Object.prototype.hasOwnProperty.call(this.extensions, extName)) {
            featureDisplayableInfo.extensions[extName] = this.extensions[extName].getInfoById(batchID);
          }
        }
      }

      return featureDisplayableInfo;
    }
  }]);
  return C3DTBatchTable;
}();

var _default = C3DTBatchTable;
exports["default"] = _default;