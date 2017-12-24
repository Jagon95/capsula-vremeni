function filterByKeys(object, keys) {
    return Object.keys(object)
        .filter(key => keys.includes(key))
        .reduce((obj, key) => {
            obj[key] = raw[key];
            return obj;
        }, {});
}