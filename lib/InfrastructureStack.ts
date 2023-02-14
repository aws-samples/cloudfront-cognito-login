import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';

import { BlockPublicAccess, Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront';
import * as secretsManager from 'aws-cdk-lib/aws-secretsmanager';


export class SampleCloudfrontCognitoStackStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const userPool = new cognito.UserPool(this,'userpool',{
      userPoolName: 'chatnonymous-user-pool',
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
      passwordPolicy: {
        minLength: 6
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    


    }); 

    const userPoolDomain = userPool.addDomain('hostedDomain',{
      cognitoDomain:{
        domainPrefix:'chatnonymous',
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

    // TODO create iam role of the premuim user
    const cfnUserPoolGroup = new cognito.CfnUserPoolGroup(this, 'premiumGroup', {
      userPoolId: userPool.userPoolId,
    
      // the properties below are optional
      description: 'description',
      groupName: 'premium',
      // roleArn: 'roleArn',
    });

    const addPremiumUserFunction = new lambda.Function(this, 'NewFunction', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'addPremiumUser.handler',
      code: lambda.Code.fromAsset('lambda'),
      // role: myRole, // user-provided role
    });
    
    // Create policy to add user to a group
    const addToCognitoGroupPolicy = new iam.PolicyStatement({
      actions: ['cognito-idp:AdminAddUserToGroup'],
      resources: [userPool.userPoolArn],
    });

    // 👇 add the policy to the Function's role
    addPremiumUserFunction.role?.attachInlinePolicy(
      new iam.Policy(this, 'add-to-group-policy', {
        statements: [addToCognitoGroupPolicy],
      }),
    );
    new apigw.LambdaRestApi(this, 'Endpoint', {
      handler: addPremiumUserFunction
    });


  //   new cdk.CfnOutput(this, 'userPoolId', {
  //     value: userPool.userPoolId,
  //   });
  //   new cdk.CfnOutput(this, 'userPoolClientId', {
  //     value: userPoolClient.userPoolClientId,
  //   });

  //   const viewerRequest = new cloudfront.experimental.EdgeFunction(this,'viewerRequest',{
  //     runtime: lambda.Runtime.NODEJS_16_X,
  //     handler: 'viewerRequest.handler',
  //     code: lambda.Code.fromAsset('lambda'),
  //     environment: {
  //       cognitoUserPoolId : userPool.userPoolId,
  //       cognitoClientId: userPoolClient.userPoolClientId,
  //       cognitoDomainName: userPoolDomain.domainName
  //     }
  //   })

  //   const originRequest = new cloudfront.experimental.EdgeFunction(this,'originRequest',{
  //     runtime: lambda.Runtime.NODEJS_16_X,
  //     handler: 'originRequest.handler',
  //     code: lambda.Code.fromAsset('lambda'),
  //     environment: {
  //       cognitoClientSecret : userPoolClient.userPoolClientSecret.unsafeUnwrap(),
  //       cognitoClientId: userPoolClient.userPoolClientId,
  //       cognitoDomainName: userPoolDomain.domainName
  //     }
  //   })

  //   // ------------------- Static chat app site cdk start -------------------
  //   const staticSiteBucket = new Bucket(this, 'staticSiteBucket', {
  //     versioned: true,
  //     encryption: BucketEncryption.S3_MANAGED,
  //     bucketName: 'ab3-static-chat-site',
  //     websiteIndexDocument: 'index.html',
  //     blockPublicAccess: BlockPublicAccess.BLOCK_ALL
  //   });

  //   new BucketDeployment(this, 'DeployWebsite', {
  //     sources: [Source.asset('ab3-static-site/dist')],
  //     destinationBucket: staticSiteBucket
  //   });

  //   const oia = new OriginAccessIdentity(this, 'OIA', {
  //     comment: "Created by CDK for AB3 static site"
  //   });
  //   staticSiteBucket.grantRead(oia);
  //   // ------------------- Static chat app site cdk end -------------------

  //  new secretsManager.Secret(this,'CognitoSecrets',{
  //   secretName: 'cognitoClientSecret'
  //  })

  //   new cloudfront.Distribution(this,'testDist',{
  //     defaultBehavior: {
  //       origin: new cdk.aws_cloudfront_origins.HttpOrigin('www.example.com'),
  //       edgeLambdas: [
  //         {
  //           functionVersion: viewerRequest.currentVersion,
  //           eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST
  //         },
  //         {
  //           functionVersion: originRequest.currentVersion,
  //           eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST
  //         }
  //       ]
  //     }
  //   })



    



  }
}
