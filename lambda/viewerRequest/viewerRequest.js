const cookie = require('cookie');
const jose = require('jose');
const jwks = jose.createLocalJWKSet(require('./jwks.json'));
const secretsManager = require('./secretsManager.js');


async function verifyToken(cf,client_id,userPoolId){
  console.log("headrs in verify token :" + JSON.stringify(cf.request.headers) );
    if (cf.request.headers.cookie) {
        const cookies = cookie.parse(cf.request.headers.cookie[0].value);
        console.log("cookies :" + JSON.stringify(cookies) );
        try {
          const { payload } = await jose.jwtVerify(cookies.token, jwks, {
            issuer: `https://cognito-idp.us-east-1.amazonaws.com/${userPoolId}`
          });
          console.log("payload from verifytoken" + payload)
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
    console.log("events incoming to viewers request: " + JSON.stringify(event))
    const cf = event.Records[0].cf;
    const secrets = await secretsManager.getSecrets()
  
    if(cf.request.uri.startsWith('/index.html') ){
      const valid = await verifyToken(cf,secrets.clientId,secrets.userPoolId);
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
              value: `https://${secrets.domainName}.auth.us-east-1.amazoncognito.com/login?client_id=${secrets.clientId}&response_type=code&scope=email+openid&redirect_uri=https%3A%2F%2Fd174lp5a9lmryl.cloudfront.net/login`,
            }]
          }
        };
      }
    }
      
    // do nothing: CloudFront continues as usual
    return cf.request;
}