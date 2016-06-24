'use strict';

module.exports = function () {
    this.count = this.count || 0;
    return this.count++;
};