const i18n = require('../data/i18n');

module.exports = function (content) {
    this.cacheble && this.cacheble();
    let data = JSON.parse(content);
    const get = (obj, i) => {
        try {
            return i.split('.').reduce((o, i) => o[i], obj);
        } catch (e) {
            console.error(e.message, 'required key: ' + i);
            return '';
        }
    };

    const i18N = (index) => {
        return get(i18n, index);
    };

    const translateFields = (obj, fields) => {
        fields.forEach((i) => {
            obj[i] = i18N(obj[i]);
        });
    };

    for (let key of Object.keys(data)) {
        translateFields(data[key], ['title', 'description']);
        data[key]['id'] = key;
    }
    return data;
};