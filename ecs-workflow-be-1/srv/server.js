const cds = require('@sap/cds')
const helmet = require('helmet')
const proxy = require('@sap/cds-odata-v2-adapter-proxy')

cds.on('bootstrap', app => {
    app.use(proxy())
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                ...helmet.contentSecurityPolicy.getDefaultDirectives()
            }
        }
    }))
})

cds.once('listening', ({ server }) => {
    server.keepAliveTimeout = 3 * 60 * 1000 // > 3 mins
})

module.exports = async opts => {
    
    const SapCfAxios = require("sap-cf-axios").default;
    const axiosRetry = require("axios-retry");
    const axios = SapCfAxios("sf-odata-pwcT2");     //"https://api12preview.sapsf.eu/odata/v2/"

    axiosRetry(axios, { retries: 2 });

    // SF metadata loading

    module.exports.fnNavProp = undefined;
    module.exports.fnProp = undefined;

    const response = await axios.get("/Entity('EmpJob')?$format=json");
    let metadata = response.data;

    try {
        metadata = JSON.parse(metadata);
    } catch(e) {}

    try {
        const fnNavProp = metadata.d.navigationProperties.results.filter(navProp => {
            return (navProp && navProp.toRole && navProp.toRole.EntitySet == "FOJobFunction");
        })[0].name;
        const fnProp = fnNavProp.match(/^(customString\d+)Nav$/)[1];

        module.exports.fnNavProp = fnNavProp;
        module.exports.fnProp = fnProp;
    } catch(e) {}

    console.log("FN NAV PROP: " + module.exports.fnNavProp);
    console.log("FN PROP: " + module.exports.fnProp);

    // SF response postprocessing

    axios.interceptors.response.use(response => {
        let data = response.data;

        if (data.d) {
            const fObjectTransform = obj => {
                return Object.keys(obj).reduce((result, key) => {
                    if (typeof obj[key] === "object" && obj[key] !== null) {
                        if (typeof obj[key] === "object" && obj[key].length) {
                            result[key] = obj[key].map(fObjectTransform);
                        }
                        else {
                            if (obj[key].results) {
                                obj[key] = obj[key].results;
                                result[key] = obj[key].map(fObjectTransform)
                            } else {
                                result[key] = fObjectTransform(obj[key]);
                            }
                        }
                    } else {
                        result[key] = obj[key]
                    }
                    return result;
                }, {});
            };

            response.data = fObjectTransform(data).d;
        }

        return response;
    }, null, { synchronous: true });

    module.exports.axios = axios

    return cds.server(opts);
} 