var amazonMWSConfigProperties = PropertiesService.getUserProperties();

var _aws_regions = function() {
  return {
      'eu': 'eu-west-1',
      'na': 'us-east-1',
      'fe': 'us-west-2'
  }
}

var _aws_regions_countries = function() {
    return {
        'A2EUQ1WTGCTBG2': 'na', //Canada
        'ATVPDKIKX0DER': 'na', //USA
        'A1AM78C64UM0Y8': 'na', //Mexico
        'A2Q3Y263D00KWC': 'na', // Brazil
        'A1RKKUPIHCS9HS': 'eu', // Spain
        'A1F83G8C2ARO7P': 'eu', // United Kingdom
        'A13V1IB3VIYZZH': 'eu', // France
        'A1805IZSGTT6HS': 'eu', // Netherlands
        'A1PA6795UKMFR9': 'eu', // Germany
        'APJ6JRA9NG5V4': 'eu', // Italy
        'A2NODRKZP88ZB9': 'eu', // Sweden
        'A1C3SOZRARQ6R3': 'eu', // Poland
        'ARBP9OOSHTCHU': 'eu', // Egypt
        'A33AVAJ2PDY3EV': 'eu', // Turkey
        'A2VIGQ35RCS4UG': 'eu', // United Arab Emirates
        'A21TJRUUN4KGV': 'eu', // India
        'A19VAU5U5O7RUS': 'fe', // Singapore
        'A39IBJ37TRP1C6': 'fe', // Australia
        'A1VC38T7YXB528': 'fe', // Japan
    }
}

var _marketplace_id = function() {

}

function _createUTCISODate() {
    let iso_date = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
    this._iso_date = {
        short: iso_date.substr(0, 8),
        full: iso_date
    };
}

function _sortQuery(query) {
    if (query && Object.keys(query).length) {
        // Sort query params by key, because it needs to be sorted for correct signature creation
        return Object.keys(query).sort().reduce((r, k) => (r[k] = query[k], r), {});
    }
    return;
}

serialize = function(obj, prefix) {
    var str = [],
        p;
    for (p in obj) {
        if (obj.hasOwnProperty(p)) {
            var k = prefix ? prefix + "[" + p + "]" : p,
                v = obj[p];
            str.push((v !== null && typeof v === "object") ?
                serialize(v, k) :
                encodeURIComponent(k) + "=" + encodeURIComponent(v));
        }
    }
    return str.join("&");
}

function _constructEncodedQueryString(values) {
    if (!values) return ""
    var parts = [];
    var items = values.split("&");
    for (var i in items) {
        var [key, value] = items[i].split("=")
        parts.push((key) + "=" + (value))
    }
    return parts.join("&")
}

function _constructCanonicalRequestForRoleCredentials(encoded_query_string) {
    var HMAC = CryptoJs_.HMAC;
    var SHA256 = CryptoJs_.SHA256;
    let canonical = [];
    canonical.push('POST');
    canonical.push('/');
    canonical.push('');
    canonical.push('host:sts.amazonaws.com');
    //canonical.push('x-amz-content-sha256:' + crypto.SHA256(encoded_query_string));
    canonical.push('x-amz-date:' + this._iso_date.full);
    canonical.push('');
    canonical.push('host;x-amz-date');
    canonical.push(SHA256(encoded_query_string));
    return canonical.join('\n');
}

function _constructCanonicalRequestForAPI(access_token, params, encoded_query_string,api_endpoint) {
    var HMAC = CryptoJs_.HMAC;
    var SHA256 = CryptoJs_.SHA256;
    let canonical = [];
    canonical.push(params.method);
    canonical.push(params.api_path);
    canonical.push(encoded_query_string);
    canonical.push('host:' + api_endpoint);
    canonical.push('x-amz-access-token:' + access_token);
    canonical.push('x-amz-date:' + this._iso_date.full);
    canonical.push('');
    canonical.push('host;x-amz-access-token;x-amz-date');
    canonical.push(SHA256(params.body ? JSON.stringify(params.body) : ''));
    return canonical.join('\n');
}

function _constructStringToSign(region, action_type, canonical_request) {
    var HMAC = CryptoJs_.HMAC;
    var SHA256 = CryptoJs_.SHA256;

    let string_to_sign = [];
    string_to_sign.push('AWS4-HMAC-SHA256')
    string_to_sign.push(this._iso_date.full);
    string_to_sign.push(this._iso_date.short + '/' + region + '/' + action_type + '/aws4_request');
    string_to_sign.push(SHA256(canonical_request));
    return string_to_sign.join('\n');
}

function _constructSignature(region, action_type, string_to_sign, secret) {
    var HMAC = CryptoJs_.HMAC;
    var SHA256 = CryptoJs_.SHA256;

    var kSecret = Utilities.newBlob('AWS4' + secret).getBytes();
    var kDate = HMAC(SHA256, this._iso_date.short, kSecret, {
        asBytes: true
    });
    var d = Utilities.computeHmacSha256Signature(Utilities.base64Decode(this._iso_date.short), kSecret);
    var kRegion = HMAC(SHA256, region, kDate, {
        asBytes: true
    });
    var kService = HMAC(SHA256, action_type, kRegion, {
        asBytes: true
    });
    var kSigning = HMAC(SHA256, "aws4_request", kService, {
        asBytes: true
    });
    return kSigning;
}

function _constructURL(req_params, encoded_query_string,_api_endpoint) {
    let url = 'https://' + _api_endpoint;
    if (req_params.api_path !== '' && req_params.api_path !== undefined) {
        url += req_params.api_path;
    }
    if (encoded_query_string !== '') {
        url += '?' + encoded_query_string;
    }
    return url;
}

function signAPIRequest(access_token, role_credentials, req_params, region) {
    var _api_endpoint = 'sellingpartnerapi-' + region + '.amazon.com';
    req_params.query = this._sortQuery(req_params.query);

    this._createUTCISODate();

    let encoded_query_string = this._constructEncodedQueryString(serialize(req_params.query));
    let canonical_request = this._constructCanonicalRequestForAPI(access_token, req_params, encoded_query_string,_api_endpoint);
    let string_to_sign = this._constructStringToSign(this._aws_regions()[region], 'execute-api', canonical_request);

    var signature = calculateSignature_(role_credentials.secret, this._iso_date.short, this._aws_regions()[region], 'execute-api', string_to_sign);

    var options = {
        'method': req_params.method,
        'payload': req_params.body ? JSON.stringify(req_params.body) : null,
        'headers': {
            'Authorization': 'AWS4-HMAC-SHA256 Credential=' + role_credentials.id + '/' + this._iso_date.short + '/' + this._aws_regions()[region] + '/execute-api/aws4_request, SignedHeaders=host;x-amz-access-token;x-amz-date, Signature=' + signature,
            'Content-Type': 'application/json; charset=utf-8',
            'x-amz-access-token': access_token,
            'x-amz-security-token': role_credentials.security_token,
            'x-amz-date': this._iso_date.full
        },
        'muteHttpExceptions': false
    };
    var response = UrlFetchApp.fetch(this._constructURL(req_params, encoded_query_string,_api_endpoint), options).getContentText();
    return response;
}

function validateSPAPICredentials(access_token, role_credentials, req_params, region) {
    var _api_endpoint = 'sellingpartnerapi-' + region + '.amazon.com';
    req_params.query = this._sortQuery(req_params.query);

    this._createUTCISODate();

    let encoded_query_string = this._constructEncodedQueryString(serialize(req_params.query));
    let canonical_request = this._constructCanonicalRequestForAPI(access_token, req_params, encoded_query_string,_api_endpoint);
    let string_to_sign = this._constructStringToSign(this._aws_regions()[region], 'execute-api', canonical_request);

    var signature = calculateSignature_(role_credentials.secret, this._iso_date.short, this._aws_regions()[region], 'execute-api', string_to_sign);

    var options = {
        'method': req_params.method,
        'payload': req_params.body ? JSON.stringify(req_params.body) : null,
        'headers': {
            'Authorization': 'AWS4-HMAC-SHA256 Credential=' + role_credentials.id + '/' + this._iso_date.short + '/' + this._aws_regions()[region] + '/execute-api/aws4_request, SignedHeaders=host;x-amz-access-token;x-amz-date, Signature=' + signature,
            'Content-Type': 'application/json; charset=utf-8',
            'x-amz-access-token': access_token,
            'x-amz-security-token': role_credentials.security_token,
            'x-amz-date': this._iso_date.full
        },
        'muteHttpExceptions': false
    };
    return UrlFetchApp.fetch(this._constructURL(req_params, encoded_query_string,_api_endpoint), options).getResponseCode();
}

function signRoleCredentialsRequest(aws_user) {
    let query = {
        'Action': 'AssumeRole',
        'Version': '2011-06-15',
        'RoleArn': aws_user.role,
        'RoleSessionName': 'SPAPISession',
        'DurationSeconds': '900'
    };

    this._createUTCISODate();

    let encoded_query_string = this._constructEncodedQueryString(serialize(query));
    let canonical_request = this._constructCanonicalRequestForRoleCredentials(encoded_query_string);
    let string_to_sign = this._constructStringToSign('us-east-1', 'sts', canonical_request);
    var signature = calculateSignature_(aws_user.secret, this._iso_date.short, 'us-east-1', 'sts', string_to_sign);

    var options = {
        'method': 'POST',
        //url:'https://sts.amazonaws.com',
        'payload': encoded_query_string,
        'headers': {
            'Authorization': 'AWS4-HMAC-SHA256 Credential=' + aws_user.id + '/' + this._iso_date.short + '/us-east-1/sts/aws4_request, SignedHeaders=host;x-amz-date, Signature=' + signature,
            'X-Amz-Date': this._iso_date.full
        },
        'muteHttpExceptions': false
    };
    var response = UrlFetchApp.fetch('https://sts.amazonaws.com/', options).getContentText();
    return response;
}

function calculateSignature_(key, dateStamp, regionName, serviceName, stringToSign) {
    var HMAC = CryptoJs_.HMAC;
    var SHA256 = CryptoJs_.SHA256;

    var kDate = HMAC(SHA256, dateStamp, 'AWS4' + key, {
        asBytes: true
    });
    var kRegion = HMAC(SHA256, regionName, kDate, {
        asBytes: true
    });
    var kService = HMAC(SHA256, serviceName, kRegion, {
        asBytes: true
    });
    var kSigning = HMAC(SHA256, 'aws4_request', kService, {
        asBytes: true
    });

    return HMAC(SHA256, stringToSign, kSigning, {
        asBytes: false
    });
}

var _aws_regions_countries = function() {
    return {
        'A2EUQ1WTGCTBG2': 'na', //Canada
        'ATVPDKIKX0DER': 'na', //USA
        'A1AM78C64UM0Y8': 'na', //Mexico
        'A2Q3Y263D00KWC': 'na', // Brazil
        'A1RKKUPIHCS9HS': 'eu', // Spain
        'A1F83G8C2ARO7P': 'eu', // United Kingdom
        'A13V1IB3VIYZZH': 'eu', // France
        'A1805IZSGTT6HS': 'eu', // Netherlands
        'A1PA6795UKMFR9': 'eu', // Germany
        'APJ6JRA9NG5V4': 'eu', // Italy
        'A2NODRKZP88ZB9': 'eu', // Sweden
        'A1C3SOZRARQ6R3': 'eu', // Poland
        'ARBP9OOSHTCHU': 'eu', // Egypt
        'A33AVAJ2PDY3EV': 'eu', // Turkey
        'A2VIGQ35RCS4UG': 'eu', // United Arab Emirates
        'A21TJRUUN4KGV': 'eu', // India
        'A19VAU5U5O7RUS': 'fe', // Singapore
        'A39IBJ37TRP1C6': 'fe', // Australia
        'A1VC38T7YXB528': 'fe', // Japan
    }
}

function subDaysFromDate(d) {
    // d = number of day ro substract and date = start date
    var result = new Date(new Date().getTime() - d * (24 * 3600 * 1000));
    return result
}

function getSessionCredential(configData) {
    if(null !== amazonMWSConfigProperties.getProperty('sessionToken')){
      var token = JSON.parse(amazonMWSConfigProperties.getProperty('sessionToken'));
      if(new Date().getTime() < token.expiry){
        return token.session_token;
      }
    }

    var token = {
      'session_token':'',
      'expiry': new Date(),
    }
    //var configData = JSON.parse(config);
    let _credentials = {
        app_client: {
            id: configData.lwaClientId.trim(),
            secret: configData.lwaClientSecret.trim()
        },
        aws_user: {
            id: configData.awsAccessKey.trim(),
            secret: configData.awsSecretKey.trim(),
            role: configData.roleArn
        },
        refreshToken: configData.refreshToken.trim(),
        marketplace: configData.defaultMarket.trim()
    }

    let signed_request = signRoleCredentialsRequest(_credentials.aws_user);
    var document = XmlService.parse(signed_request);
    var root = document.getRootElement();
    var atom = XmlService.getNamespace('https://sts.amazonaws.com/doc/2011-06-15/');
    var accessKeyId = root.getChild('AssumeRoleResult', atom).getChild('Credentials', atom).getChild('AccessKeyId', atom).getText();
    var secretAccessKey = root.getChild('AssumeRoleResult', atom).getChild('Credentials', atom).getChild('SecretAccessKey', atom).getText();
    var sessionToken = root.getChild('AssumeRoleResult', atom).getChild('Credentials', atom).getChild('SessionToken', atom).getText();
    var expiry = root.getChild('AssumeRoleResult', atom).getChild('Credentials', atom).getChild('Expiration', atom).getText();

    token.session_token= {
        id: accessKeyId,
        secret: secretAccessKey,
        security_token: sessionToken,
    };
    token.expiry=Date.parse(expiry);
    amazonMWSConfigProperties.setProperty('sessionToken',JSON.stringify(token));
    return token.session_token;
}

function getAccessToken(config) {
  if(null !== amazonMWSConfigProperties.getProperty('accessToken')){
      var token = JSON.parse(amazonMWSConfigProperties.getProperty('accessToken'));
      if(new Date().getTime() < token.expiry){
        return token.access_token;;
      }
    }

    var token = {
      'access_token':'',
      'expiry': new Date(),
    }
    //API variables
    var end_point = 'https://api.amazon.com/auth/o2/token';
    var options = {
        'method': 'POST',
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        'muteHttpExceptions': true,
        'payload': {
            "grant_type": "refresh_token",
            "refresh_token": config.refreshToken,
            "client_id": config.lwaClientId,
            "client_secret": config.lwaClientSecret
        }
    }
    var accessToken = UrlFetchApp.fetch(end_point, options);
    token.access_token=JSON.parse(accessToken).access_token;
    var today = new Date();
    token.expiry=today.setMinutes(today.getMinutes() + 50);
    amazonMWSConfigProperties.setProperty('accessToken',JSON.stringify(token));
    return token.access_token;
}

function validateCredentials(formdata) {
    try {
        var config = JSON.parse(formdata);
        let _role_credentials = getSessionCredential(config);
        var access_token = getAccessToken(config);
        let req_param = {
            api_path: '/sellers/v1/marketplaceParticipations',
            method: 'GET'
        }
        return validateSPAPICredentials(access_token, _role_credentials, req_param, _aws_regions_countries()[config.defaultMarket]);
    } catch (e) {
        Logger.log(e);
        throw new Error(e);
    }
}

/************************************************************************
*
* Gets the last row number based on a selected column range values
* @param {array} range : takes a 2d array of a single column's values
* @returns {number} : the last row number with a value.
*
*/

function getLastRowSpecial(range){
  var rowNum = 0;
  var blank = false;
  for(var row = 0; row < range.length; row++){

    if(range[row][0] === "" && !blank){
      rowNum = row;
      blank = true;
    }else if(range[row][0] !== ""){
      blank = false;
    };
  };
  return rowNum;
};

var CryptoJs_ = (function() {
    var window = {};
    var Crypto = undefined;
    /**
     * Crypto-JS v2.5.3
     * http://code.google.com/p/crypto-js/
     * (c) 2009-2012 by Jeff Mott. All rights reserved.
     * http://code.google.com/p/crypto-js/wiki/License
     */
    // start sha256/CryptoJS
    (typeof Crypto == "undefined" || !Crypto.util) && function() {
        var d = window.Crypto = {},
            k = d.util = {
                rotl: function(b, a) {
                    return b << a | b >>> 32 - a
                },
                rotr: function(b, a) {
                    return b << 32 - a | b >>> a
                },
                endian: function(b) {
                    if (b.constructor == Number) return k.rotl(b, 8) & 16711935 | k.rotl(b, 24) & 4278255360;
                    for (var a = 0; a < b.length; a++) b[a] = k.endian(b[a]);
                    return b
                },
                randomBytes: function(b) {
                    for (var a = []; b > 0; b--) a.push(Math.floor(Math.random() * 256));
                    return a
                },
                bytesToWords: function(b) {
                    for (var a = [], c = 0, e = 0; c < b.length; c++, e += 8) a[e >>> 5] |= (b[c] & 255) <<
                        24 - e % 32;
                    return a
                },
                wordsToBytes: function(b) {
                    for (var a = [], c = 0; c < b.length * 32; c += 8) a.push(b[c >>> 5] >>> 24 - c % 32 & 255);
                    return a
                },
                bytesToHex: function(b) {
                    for (var a = [], c = 0; c < b.length; c++) a.push((b[c] >>> 4).toString(16)), a.push((b[c] & 15).toString(16));
                    return a.join("")
                },
                hexToBytes: function(b) {
                    for (var a = [], c = 0; c < b.length; c += 2) a.push(parseInt(b.substr(c, 2), 16));
                    return a
                },
                bytesToBase64: function(b) {
                    if (typeof btoa == "function") return btoa(g.bytesToString(b));
                    for (var a = [], c = 0; c < b.length; c += 3)
                        for (var e = b[c] << 16 | b[c + 1] <<
                                8 | b[c + 2], p = 0; p < 4; p++) c * 8 + p * 6 <= b.length * 8 ? a.push("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(e >>> 6 * (3 - p) & 63)) : a.push("=");
                    return a.join("")
                },
                base64ToBytes: function(b) {
                    if (typeof atob == "function") return g.stringToBytes(atob(b));
                    for (var b = b.replace(/[^A-Z0-9+\/]/ig, ""), a = [], c = 0, e = 0; c < b.length; e = ++c % 4) e != 0 && a.push(("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(b.charAt(c - 1)) & Math.pow(2, -2 * e + 8) - 1) << e * 2 | "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(b.charAt(c)) >>>
                        6 - e * 2);
                    return a
                }
            },
            d = d.charenc = {};
        d.UTF8 = {
            stringToBytes: function(b) {
                return g.stringToBytes(unescape(encodeURIComponent(b)))
            },
            bytesToString: function(b) {
                return decodeURIComponent(escape(g.bytesToString(b)))
            }
        };
        var g = d.Binary = {
            stringToBytes: function(b) {
                for (var a = [], c = 0; c < b.length; c++) a.push(b.charCodeAt(c) & 255);
                return a
            },
            bytesToString: function(b) {
                for (var a = [], c = 0; c < b.length; c++) a.push(String.fromCharCode(b[c]));
                return a.join("")
            }
        }
    }();
    Crypto = window.Crypto;
    (function() {
        var d = Crypto,
            k = d.util,
            g = d.charenc,
            b = g.UTF8,
            a = g.Binary,
            c = [1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921,
                2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298
            ],
            e = d.SHA256 = function(b, c) {
                var f = k.wordsToBytes(e._sha256(b));
                return c && c.asBytes ? f : c && c.asString ? a.bytesToString(f) : k.bytesToHex(f)
            };
        e._sha256 = function(a) {
            a.constructor == String && (a = b.stringToBytes(a));
            var e = k.bytesToWords(a),
                f = a.length * 8,
                a = [1779033703, 3144134277,
                    1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225
                ],
                d = [],
                g, m, r, i, n, o, s, t, h, l, j;
            e[f >> 5] |= 128 << 24 - f % 32;
            e[(f + 64 >> 9 << 4) + 15] = f;
            for (t = 0; t < e.length; t += 16) {
                f = a[0];
                g = a[1];
                m = a[2];
                r = a[3];
                i = a[4];
                n = a[5];
                o = a[6];
                s = a[7];
                for (h = 0; h < 64; h++) {
                    h < 16 ? d[h] = e[h + t] : (l = d[h - 15], j = d[h - 2], d[h] = ((l << 25 | l >>> 7) ^ (l << 14 | l >>> 18) ^ l >>> 3) + (d[h - 7] >>> 0) + ((j << 15 | j >>> 17) ^ (j << 13 | j >>> 19) ^ j >>> 10) + (d[h - 16] >>> 0));
                    j = f & g ^ f & m ^ g & m;
                    var u = (f << 30 | f >>> 2) ^ (f << 19 | f >>> 13) ^ (f << 10 | f >>> 22);
                    l = (s >>> 0) + ((i << 26 | i >>> 6) ^ (i << 21 | i >>> 11) ^ (i << 7 | i >>> 25)) +
                        (i & n ^ ~i & o) + c[h] + (d[h] >>> 0);
                    j = u + j;
                    s = o;
                    o = n;
                    n = i;
                    i = r + l >>> 0;
                    r = m;
                    m = g;
                    g = f;
                    f = l + j >>> 0
                }
                a[0] += f;
                a[1] += g;
                a[2] += m;
                a[3] += r;
                a[4] += i;
                a[5] += n;
                a[6] += o;
                a[7] += s
            }
            return a
        };
        e._blocksize = 16;
        e._digestsize = 32
    })();
    (function() {
        var d = Crypto,
            k = d.util,
            g = d.charenc,
            b = g.UTF8,
            a = g.Binary;
        d.HMAC = function(c, e, d, g) {
            e.constructor == String && (e = b.stringToBytes(e));
            d.constructor == String && (d = b.stringToBytes(d));
            d.length > c._blocksize * 4 && (d = c(d, {
                asBytes: !0
            }));
            for (var f = d.slice(0), d = d.slice(0), q = 0; q < c._blocksize * 4; q++) f[q] ^= 92, d[q] ^= 54;
            c = c(f.concat(c(d.concat(e), {
                asBytes: !0
            })), {
                asBytes: !0
            });
            return g && g.asBytes ? c : g && g.asString ? a.bytesToString(c) : k.bytesToHex(c)
        }
    })();
    // end sha256/CryptoJS

    return window.Crypto;
})()
