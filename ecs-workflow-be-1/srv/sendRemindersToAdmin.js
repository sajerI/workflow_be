const { axios } = require("./server");
const utils = require("./utils");
const cds = require('@sap/cds')
const impl = require("./common");

const aDummy = ['a'];
var aRecords
console.log("cron schedules");
aRecords = impl.getRecordForEmailReminders()


console.log('Email reminder job scheduled.');
