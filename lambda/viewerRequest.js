const cookie = require('cookie');
const jose = require('jose');
const getSecrets = require('../util/secretsManager.js');

const jwks = jose.createLocalJWKSet(require('./jwks.json'));

async function verifyToken(cf,client_id,userPoolId){
    if (cf.request.headers.cookie) {
        const cookies = cookie.parse(cf.request.headers.cookie[0].value);
        try {
          const { payload } = await jose.jwtVerify(cookies.token, jwks, {
            issuer: `https://cognito-idp.eu-west-1.amazonaws.com/${userPoolId}`
          });
          if (payload.client_id === client_id) {
            return true;
          }
        } catch(err) {
          console.log(`token error: ${err.name} ${err.message}`);
        }
      }
      return false;
}

exports.handler = async function(event) {
    const cf = event.Records[0].cf;
    const secrets = getSecrets();
    // check if path is protected and requires the user to be logged in
    if (
      cf.request.uri.startsWith('/') || cf.request.uri.startsWith('/home') 
      )
    ) {
      const valid = await verifyToken(cf,secrets.ClientID,secrets.UserPoolID);
      if (valid === true) {
        return cf.request;
      } else {
        return {
          status: '302',
          statusDescription: 'Found',
          headers: {
            location: [{ // instructs browser to redirect after receiving the response
              key: 'Location',
              value: `https://${secrets.DomainName}.auth.eu-west-1.amazoncognito.com/login?client_id=${secrets.ClientID}&response_type=code&scope=email+openid&redirect_uri=https%3A%2F%2Fexample.com`,
            }]
          }
        };
      }
    }
    // do nothing: CloudFront continues as usual
    return cf.request;
}