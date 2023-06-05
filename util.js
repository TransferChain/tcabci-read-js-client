const {CHARACTERS} = require("./constants");

const randomString = (length) => {
    let result = '';
    const charactersLength = CHARACTERS.length;
    let counter = 0;
    while (counter < length) {
        result += CHARACTERS.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

const toJSON = (data) => {
    return JSON.parse(data)
}

module.exports = {
    randomString,
    toJSON
}