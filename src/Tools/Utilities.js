// import RNFetchBlob from 'rn-fetch-blob';

const  Moment = require("moment"),
      { get } = require('https');

// const configFile = RNFS.DocumentDirectoryPath + "/tenor_config.json";
//const configFile = RNFetchBlob.fs.dirs.DocumentDir + "/tenor_config.json";

exports.callAPI = function (path, callback)
{
      get(path, (result) => {
            let error, rawData = "";

            const code = result.statusCode,
                  type = result.headers["content-type"];

            if (code !== 200)
            {
                  error      = `# [TenorJS] Could not send request @ ${path} - Status Code: ${code}`;
                  error.code = "ERR_REQ_SEND";
            }

            if (type.indexOf("application/json") === -1)
            {
                  error      = `# [TenorJS] Content received isn't JSON. Type: ${type}`;
                  error.code = "ERR_RES_NOT";
            }

            if (error)
            {
                  result.resume();
                  callback(error);
            }

            result.setEncoding("utf8");

            result.on("data", function (buffer)
            {
                  rawData += buffer;
            });

            result.on("end", () => {
                  let data, error = null, dForm;

                  try {
                        /**
                         * Path checks.
                         */
                        if (path.includes("categories")) {
                              dForm = JSON.parse(rawData).tags;
                        } else {
                              dForm = JSON.parse(rawData).results;
                        }

                        data = dForm;

                        for (let data of Object.values(data)) {
                              if (!data.title) data.title = "Untitled";

                              if (!path.includes("categories")) {
                                    data.created_stamp = data.created;
                                    // data.created = Moment.unix(data.created).format(require(configFile)["DateFormat"]);
                              }
                        }
                  } catch (e) {
                        error = "# [TenorJS] Failed to parse retrieved JSON.";
                        error.code = 'ERR_JSON_PARSE';
                  }

                  callback(error, data);
            });
      });
};


exports.manageAPI = function (endpoint, callback, pResolve, pReject)
{
      this.callAPI(endpoint, (error, result) => {
            if (error)
            {
                  if (typeof callback === "function") callback(error);

                  pReject(error);

                  return;
            }

            if (typeof callback === "function") callback(null, result[0]);

            pResolve(result);
      });
};


exports.generateAnon = function (endpoint)
{
      return this.callAPI(endpoint, (error, result) => {
            if(error) console.error(error);

            JSON.parse(result).anon_id;
      });
};


exports.checkVersion = function () {
      const Package = {
        "Git": "https://raw.githubusercontent.com/Jinzulen/TenorJS/master/package.json",
        "Home": require('../../package.json')["version"]
      };
    
      return RNFetchBlob.fetch('GET', Package["Git"])
        .then(Response => {
          let Version = JSON.parse(Response.text()).version;
    
          if (Package["Home"] < Version) {
            console.error(`You are running an oudated version (v${Package["Home"]}) of TenorJS, v${Version} is available.\n
    # NPM: https://www.npmjs.com/package/tenorjs
    # GitHub: https://github.com/Jinzulen/TenorJS/
    # Why you should upgrade: https://github.com/Jinzulen/TenorJS/blob/master/changelogs/${Version}.md`);
    
         
          }
        })
        .catch(console.error);
};
    
