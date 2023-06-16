const cookie = require('cookie');
const jose = require('jose');
const jwks = jose.createLocalJWKSet(require('./jwks.json'));
const secretsManager = require('./secretsManager.js');


async function verifyToken(cf,client_id,userPoolId){
    if (cf.request.headers.cookie) {
        const cookies = cookie.parse(cf.request.headers.cookie[0].value);
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
              value: `https://${secrets.DomainName}.auth.us-east-1.amazoncognito.com/login?client_id=${secrets.ClientID}&response_type=code&scope=email+openid&redirect_uri=https%3A%2F%2F${secrets.DistributionDomainName}/login`,
            }]
          }
        };
      }
    }
      
    // do nothing: CloudFront continues as usual
    return cf.request;
}