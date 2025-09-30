Handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('ifEmpty', function (arg1, options) {
    return (arg1.trim().length == 0) ? options.fn(this) : options.inverse(this);
});