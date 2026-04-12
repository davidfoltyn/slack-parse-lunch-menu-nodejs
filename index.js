var request = require('request');
var cheerio = require('cheerio');
var moment = require('moment');
var stdio = require('stdio');
var ops = stdio.getopt({
    'restaurant': {args: 1, mandatory: true, description: 'Restaurant to parse'},
    'url': {args: 1, mandatory: true, description: 'Url to post'},
    'source': {args: 1, mandatory: false, description: 'Source url to parse (overrides hardcoded url)'}
});

var url = null;
var parse = null;
switch (ops.restaurant) {
    case 'menu-lg':
        url = 'https://www.pizzeria-lagamba.com/denni-menu/';
        parse = function ($) {
            var text = null;
            var img = $('#_gallery-12-249 img[src*="Menu-LG"]');
            if (!img.length) {
                img = $('#_gallery-12-249 img[src*=".jpg"]').first();
            }
            if (img.length) {
                text = img.attr('src');
            }
            return text;
        };
        break;

    case 'poolgrill':
        url = 'https://www.poolgrill.cz/pooledni-menu/';
        parse = function ($) {
            var text = null;
            var img = $('#wnd_ImageBlock_97525 img');
            if (img.length) {
                text = img.attr('src');
            }
            return text;
        };
        break;

    default:
        console.log('neznámá restaurace');
        process.exit();
        break;

}

if (ops.source) {
    url = ops.source;
}

request(url, function (error, response, html) {
    if (!error) {
        var result = parse(cheerio.load(html));
        var body;
        if (result && /^https?:\/\//.test(result)) {
            body = {
                type: 'message',
                attachments: [{
                    contentType: 'application/vnd.microsoft.card.adaptive',
                    content: {
                        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
                        type: 'AdaptiveCard',
                        version: '1.2',
                        msTeams: { width: 'full' },
                        body: [{
                            type: 'Image',
                            url: result,
                            size: 'stretch'
                        }]
                    }
                }]
            };
        } else {
            body = { text: result };
        }
        request.post({
            uri: ops.url,
            json: true,
            body: body
        }, function (error, response) {
            console.log(error ? error : response.body);
        });
    } else {
        console.log(error);
    }
});
