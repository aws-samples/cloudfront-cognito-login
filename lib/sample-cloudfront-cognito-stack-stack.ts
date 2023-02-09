import * as cdk from 'aws-cdk-lib';
import { Duration } from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as lambda from 'aws-cdk-lib/aws-lambda';


export class SampleCloudfrontCognitoStackStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const userPool = new cognito.UserPool(this,'userpool',{
      userPoolName: 'test-user-pool',
      selfSignUpEnabled: true,
      signInAliases: {
        email:true,
      },
      autoVerify: {
        email:true
      },
      standardAttributes:{
        givenName : {
          required: true,
          mutable: true
        },
        familyName:{
          required: true,
          mutable: true
        }
      },
      customAttributes:{
        isPremium: new cognito.StringAttribute({mutable:true})
      },
      passwordPolicy: {
        minLength: 6
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    


    }); 

    const userPoolDomain = userPool.addDomain('hostedDomain',{
      cognitoDomain:{
        domainPrefix:'test-ahsan-auth',
      }
    });

  

    const standardCognitoAttributes = {
      givenName: true,
      familyName: true,
      email: true,
      emailVerified: true
    }

  

    const userPoolClient = userPool.addClient('Client',{
      oAuth: {
        flows: {
          authorizationCodeGrant: true
        },
        scopes:[cognito.OAuthScope.EMAIL]
      },
      authFlows:{
        userPassword:true
      },
      generateSecret: true,
      supportedIdentityProviders:[cognito.UserPoolClientIdentityProvider.COGNITO],
      preventUserExistenceErrors: true,
      refreshTokenValidity: Duration.days(30),
      accessTokenValidity: Duration.days(1),
      idTokenValidity: Duration.days(1)
    });

    new cdk.CfnOutput(this, 'userPoolId', {
      value: userPool.userPoolId,
    });
    new cdk.CfnOutput(this, 'userPoolClientId', {
      value: userPoolClient.userPoolClientId,
    });

    const viewerRequest = new cloudfront.experimental.EdgeFunction(this,'viewerRequest',{
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'viewerRequest.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        cognitoUserPoolId : userPool.userPoolId,
        cognitoClientId: userPoolClient.userPoolClientId,
        cognitoDomainName: userPoolDomain.domainName
      }
    })

    const originRequest = new cloudfront.experimental.EdgeFunction(this,'originRequest',{
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'originRequest.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        cognitoClientSecret : userPoolClient.userPoolClientSecret.unsafeUnwrap(),
        cognitoClientId: userPoolClient.userPoolClientId,
        cognitoDomainName: userPoolDomain.domainName
      }
    })

    new cloudfront.Distribution(this,'testDist',{
      defaultBehavior: {
        origin: new cdk.aws_cloudfront_origins.HttpOrigin('www.example.com'),
        edgeLambdas: [
          {
            functionVersion: viewerRequest.currentVersion,
            eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST
          },
          {
            functionVersion: originRequest.currentVersion,
            eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST
          }
        ]
      }
    })



    



  }
}
