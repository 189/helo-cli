"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Cli = /** @class */ (function () {
    function Cli() {
    }
    Cli.prototype.create = function (dir, option) {
        console.log(dir, option);
    };
    Cli.prototype.list = function () {
        console.log('list');
    };
    return Cli;
}());
exports.default = Cli;
//# sourceMappingURL=cli.js.map