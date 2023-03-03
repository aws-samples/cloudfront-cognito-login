// required libraries
const querystring = require('querystring'); 
const cookie = require('cookie');
const axios = require('axios'); 
const secretsManager = require('./secretsManager.js');






exports.handler = async function(event) {
  console.log("event in origin request :" + JSON.stringify(event))
  const secrets = await secretsManager.getSecrets()
  const cf = event.Records[0].cf;
  if (cf.request.uri.startsWith('/login')) {
    const {code} = querystring.parse(cf.request.querystring);
   
      const res = await axios({
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          authorization: 'Basic ' + Buffer.from(secrets.ClientID + ':' + secrets.ClientSecret).toString('base64')
        },
        data: querystring.stringify({
          grant_type: 'authorization_code',
          redirect_uri: 'https://d3bi4zi96h8wdp.cloudfront.net/login',
          code
        }),
        url: `https://${secrets.DomainName}.auth.us-east-1.amazoncognito.com/oauth2/token`,
      });
    
    if (res.status === 200) {
      const setCookieValue = cookie.serialize('token', res.data.access_token, {
        maxAge: res.data.expires_in,
        path: '/',
        secure: true
      });
      return {
        status: '302',
        headers: {
          location: [{ // instructs browser to redirect after receiving the response
          	key: 'Location',
          	value: '/index.html'
          }],
          'set-cookie': [{ // instructs browser to store a cookie
          	key: 'Set-Cookie',
          	value: setCookieValue
          }],
          'cache-control': [{ // ensures that CloudFront does not cache the response
          	key: 'Cache-Control',
          	value: 'no-cache'
          }]
        }
      };
    } else {
      throw new Error('unexpected status code: ' + res.status);
    }
  }
  // do nothing: CloudFront continues as usual
  return cf.request;
};