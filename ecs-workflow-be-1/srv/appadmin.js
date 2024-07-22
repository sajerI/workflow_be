const { axios } = require("./server");
const utils = require("./utils");
const cds = require('@sap/cds')

//const { Rules } = cds.entities ('sap.capire.bookshop')


module.exports = {
    checkExistenceOfEntity: async (request) => {
        const db = await cds.connect.to("db")
        const { RulesDefault } = db.entities("pwc.psc.ecs.workflow")
        const sKey = request.data.id
        //const sValues = request.data.values
        //console.log("sValues", sValues)
        //const aValues = sValues.split(",")

        if ('values' in request.data) {
            const sValues = request.data.values
            const aValues = sValues.split(",")
            // Key 'values' exists in request.data
            try {
                //aItems = await db.run(SELECT.from(EmployeeView).where`assignedTo LIKE ${'%' + personIdExternal + '%'} AND statusApprover IN ${aInClauseParams}`) //Find items for logged user
                var aItems = await db.run(
                    SELECT.from(RulesDefault)
                        .where`id <> ${sKey}` //LIKE ${'%' + personIdExternal + '%'} IN ${aValues} values LIKE ${'%' + aValues + '%'} AND
                );
            } catch (error) {
                console.error(error);
            }

            return aValues.forEach(oValue => {
                aItems.some(oItem => {
                    if (oItem.values.includes(oValue)) {
                        request.reject(400, "Value " + oValue + " already exists in another program: " + oItem.id);
                    }
                })

            });
        }

    }
};