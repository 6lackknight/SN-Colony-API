const { getNetworkClient } = require("@colony/colony-js-client")
const { open } = require("@colony/purser-software")
const BN = require("bn.js");

const colonyClient = null;

exports.ViewTask = function (taskId) {
	// Task Pulling
}

exports.init = function (colonyClient) {
	this.colonyClient = colonyClient
}