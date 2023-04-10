const uri = "http://api.quotable.io/random";

module.exports = getData = () => {
  return fetch(uri).then((response) => response.data.content.split(""));
};
