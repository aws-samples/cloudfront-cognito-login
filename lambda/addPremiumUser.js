var AWS = require('aws-sdk');
var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({ apiVersion: '2016-04-18' });

exports.handler = (event, context, callback) => {
    console.log('request:', JSON.stringify(event, undefined, 2));

    var premiumGroupName = process.env.premiumGroupName
    var username = JSON.parse(event.body, undefined, 2).username

    var params = {
        GroupName: premiumGroupName,
        UserPoolId: process.env.cognitoUserPoolId,
        Username: username
      }
    
    console.log('Adding user ', username, " to premium group.")
    cognitoidentityserviceprovider.adminAddUserToGroup(params, function (err, data) {
    console.log(params)
    if (err) {
        console.log("Error", err);
        throw err;
    }
    else console.log("Success");

    });
  
  };
  
  
  
  