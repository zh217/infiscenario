const jwt = require("jsonwebtoken");
const httpError = require('http-errors');

const undefinedIfEmpty = (o) => o && o.length ? o : undefined;

function getPgSettings(
    {jwtToken, jwtSecret, jwtAudiences, jwtRole, jwtVerifyOptions, pgDefaultRole}) {

    let role = pgDefaultRole;
    let jwtClaims = {};

    if (jwtToken) {

        try {
            if (typeof jwtSecret !== 'string')
                throw new Error('Not allowed to provide a JWT token.');
            if (jwtAudiences != null && jwtVerifyOptions && 'audience' in jwtVerifyOptions)
                throw new Error(`Provide either 'jwtAudiences' or 'jwtVerifyOptions.audience' but not both`);
            jwtClaims = jwt.verify(jwtToken, jwtSecret, Object.assign({}, jwtVerifyOptions, {
                audience: jwtAudiences ||
                    (jwtVerifyOptions && 'audience' in jwtVerifyOptions
                        ? undefinedIfEmpty(jwtVerifyOptions.audience)
                        : ['postgraphile'])
            }));
            const roleClaim = getPath(jwtClaims, jwtRole);
            console.log("claim role", roleClaim);

            if (typeof roleClaim !== 'undefined') {
                if (typeof roleClaim !== 'string')
                    throw new Error(`JWT \`role\` claim must be a string. Instead found '${typeof jwtClaims['role']}'.`);
                role = roleClaim;
            }
        }
        catch (error) {
            error.statusCode =
                'name' in error && error.name === 'TokenExpiredError'
                    ?
                    401
                    :
                    403;
            throw error;
        }
    }

    const localSettings = {};

    if (typeof role === 'string') {
        localSettings['role'] = role;
    }

    for (const key in jwtClaims) {
        if (jwtClaims.hasOwnProperty(key)) {
            const rawValue = jwtClaims[key];

            const value = rawValue != null && typeof rawValue === 'object' ? JSON.stringify(rawValue) : rawValue;
            if (isPgSettingValid(value)) {
                localSettings[`jwt.claims.${key}`] = String(value);
            }
        }
    }
    return localSettings;
}


function getPath(inObject, path) {
    console.log("getpath", inObject, path);
    let object = inObject;

    let index = 0;
    const length = path.length;
    while (object && index < length) {
        object = object[path[index++]];
    }
    return index && index === length ? object : undefined;
}

function isPgSettingValid(pgSetting) {
    if (pgSetting === undefined || pgSetting === null) {
        return false;
    }
    const typeOfPgSetting = typeof pgSetting;
    if (typeOfPgSetting === 'string' ||
        typeOfPgSetting === 'number' ||
        typeOfPgSetting === 'boolean') {
        return true;
    }
    // TODO: booleans!
    throw new Error(`Error converting pgSetting: ${typeof pgSetting} needs to be of type string, number or boolean.`);
}


function createBadAuthorizationHeaderError() {
    return httpError(400, 'Authorization header is not of the correct bearer scheme format.');
}

const authorizationBearerRex = /^\s*bearer\s+([a-z0-9\-._~+/]+=*)\s*$/i;

function getJwtToken(request){
    const { authorization } = request.headers;
    if (Array.isArray(authorization)) throw createBadAuthorizationHeaderError();

    // If there was no authorization header, just return null.
    if (authorization == null) return null;

    const match = authorizationBearerRex.exec(authorization);

    // If we did not match the authorization header with our expected format,
    // throw a 400 error.
    if (!match) throw createBadAuthorizationHeaderError();

    // Return the token from our match.
    return match[1];
}


module.exports = {getJwtToken, getPgSettings};
