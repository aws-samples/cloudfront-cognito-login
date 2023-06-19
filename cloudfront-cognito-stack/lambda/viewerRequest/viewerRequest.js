const cookie = require('cookie');
const jose = require('jose');
const secretsManager = require('./secretsManager.js');
const axios = require('axios'); 



async function verifyToken(cf,client_id,userPoolId){
    if (cf.request.headers.cookie) {
        const cookies = cookie.parse(cf.request.headers.cookie[0].value);
        const jwksRes = await axios(
          {
            method: 'GET',
            url: `https://cognito-idp.us-east-1.amazonaws.com/${userPoolId}/.well-known/jwks.json`
          }
        );
        const jwks = jose.createLocalJWKSet(jwksRes);
        try {
          const { payload } = await jose.jwtVerify(cookies.token, jwks, {
            issuer: `https://cognito-idp.us-east-1.amazonaws.com/${userPoolId}`
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
    const secrets = await secretsManager.getSecrets()
  
    if(cf.request.uri.startsWith('/index.html') ){
      const valid = await verifyToken(cf, secrets.ClientID, secrets.UserPoolID);
      console.log(valid);
      if (valid === true) {
        return cf.request;
      } else {
        return {
          status: '302',
          statusDescription: 'Found',
          headers: {
            location: [{ // instructs browser to redirect after receiving the response
              key: 'Location',
              value: `https://${secrets.DomainName}.auth.us-east-1.amazoncognito.com/login?client_id=${secrets.ClientID}&response_type=code&scope=email+openid&redirect_uri=https%3A%2F%2Fd3bi4zi96h8wdp.cloudfront.net/login`,
            }]
          }
        };
      }
    }
      
    // do nothing: CloudFront continues as usual
    return cf.request;
}