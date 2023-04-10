const fetch = require("node-fetch");

const uri = "http://api.quotable.io/random";

module.exports = getData = () => {
  return fetch(uri)
    .then((response) => response.json())
    .then((data) => data?.content?.split(""));
};
