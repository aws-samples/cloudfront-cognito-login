var AWS = require('aws-sdk');
var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({ apiVersion: '2016-04-18' });

exports.handler = (event, context, callback) => {
  console.log('request:', JSON.stringify(event, undefined, 2));

  var premiumGroupName = process.env.premiumGroupName
  var username = event.username

  var params = {
    GroupName: premiumGroupName,
    UserPoolId: process.env.cognitoUserPoolId,
    Username: username
  }

  console.log('Adding user ', username, " to premium group.")
  cognitoidentityserviceprovider.adminAddUserToGroup(params, function (err, data) {
    console.log(params);
    if (!err) { // Check if no errors were present. It will also succeed if user already exists in group.
      callback(null, {
        statusCode: 200,
        headers: { 'Content-Type': 'text/plain' },
        body: `Successfully added to premium, user: "${username}".\n`,
      });
    }
    else if (err.name == "UserNotFoundException") {
      callback(null, {
        statusCode: 400,
        headers: { 'Content-Type': 'text/plain' },
        body: `Does not exist, user: "${username}".\n`,
      });
    }

  });
};



