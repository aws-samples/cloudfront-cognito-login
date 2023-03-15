import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { BlockPublicAccess, Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { OriginAccessIdentity, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { aws_wafv2 as wafv2 } from 'aws-cdk-lib';




export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda@edge handlers start//
    
    const readSecretsPolicy = new iam.PolicyStatement({
      actions: ['secretsmanager:GetSecretValue'],
      resources: ['arn:aws:secretsmanager:us-east-1:272525670255:secret:chatnonymousSecrets-onQd9j'], // This secret should already be present
    });

    const viewerRequest = new cloudfront.experimental.EdgeFunction(this, 'viewerRequest', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'viewerRequest.handler',
      code: lambda.Code.fromAsset('lambda/viewerRequest'),
    });
    viewerRequest.role?.attachInlinePolicy(
      new iam.Policy(this, 'add-secret-viewer-policy', {
        statements: [readSecretsPolicy],
      }),
    );

    const originRequest = new cloudfront.experimental.EdgeFunction(this, 'originRequest', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'originRequest.handler',
      code: lambda.Code.fromAsset('lambda/originRequest'),
    });
    originRequest.role?.attachInlinePolicy(
      new iam.Policy(this, 'add-secret-origin-policy', {
        statements: [readSecretsPolicy],
      }),
    );
    // Lambda@edge handlers end//


    // ------------------- Static chat app site cdk start -------------------
    const staticSiteBucket = new Bucket(this, 'staticSiteBucket', {
      versioned: true,
      encryption: BucketEncryption.S3_MANAGED,
      bucketName: 'ab3-static-chat-site',
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL
    });


    const oia = new OriginAccessIdentity(this, 'OIA', {
      comment: "Created by CDK for AB3 static site"
    });

    staticSiteBucket.grantRead(oia)
    // ------------------- Static chat app site cdk end -------------------

    // AWS WAF Start //

    const cfnWebACL = new wafv2.CfnWebACL(this, 'MyCDKWebAcl', {

      defaultAction: {
        allow: {}
      },
      scope: 'CLOUDFRONT',
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: 'MetricForWebACLCDK',
        sampledRequestsEnabled: true,
      },
      name: 'MyCDKWebAcl',
      rules: [{
        name: 'CRSRule',
        priority: 0,
        statement: {
          managedRuleGroupStatement: {
            name: 'AWSManagedRulesAmazonIpReputationList',
            vendorName: 'AWS'
          }
        },
        visibilityConfig: {
          cloudWatchMetricsEnabled: true,
          metricName: 'MetricForWebACLCDK-CRS',
          sampledRequestsEnabled: true,
        },
        overrideAction: {
          none: {}
        },
      }]
    });

    // AWS WAF End //

    // AWS CloudFront Start //

    const cfDistro = new cloudfront.Distribution(this, 'chatnonymous', {
      defaultBehavior: {
        origin: new cdk.aws_cloudfront_origins.S3Origin(staticSiteBucket,{
          originAccessIdentity : oia
        }),
        originRequestPolicy: new cloudfront.OriginRequestPolicy(this, 'queryStringOnly', {
          queryStringBehavior: cloudfront.OriginRequestQueryStringBehavior.all(),
          cookieBehavior: cloudfront.OriginRequestCookieBehavior.allowList("token")
        }),
        edgeLambdas: [
          {
            functionVersion: viewerRequest.currentVersion,
            eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST
          },
          {
            functionVersion: originRequest.currentVersion,
            eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST
          }
        ],
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      webAclId: cfnWebACL.attrArn,
      enableLogging: true,
      logIncludesCookies: true,
      logFilePrefix: 'cloudfront-logs',
      defaultRootObject: 'index.html'
    })

    // AWS CloudFront end //

    // AWS Cognito Start //



    const userPool = new cognito.UserPool(this, 'userpool', {
      userPoolName: 'chatnonymous-user-pool',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true
      },
      standardAttributes: {
        givenName: {
          required: true,
          mutable: true
        },
        familyName: {
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

    const userPoolDomain = userPool.addDomain('hostedDomain', {
      cognitoDomain: {
        domainPrefix: 'chatnonymous',
      }
    });

    const userPoolClient = userPool.addClient('Client', {
      oAuth: {
        flows: {
          authorizationCodeGrant: true
          // implicitCodeGrant: true
        },
        scopes: [cognito.OAuthScope.EMAIL],
        callbackUrls: [`https://${cfDistro.distributionDomainName}/login`, `https://${cfDistro.distributionDomainName}/index.html`]
      },
      authFlows: {
        userPassword: true
      },
      generateSecret: true,
      supportedIdentityProviders: [cognito.UserPoolClientIdentityProvider.COGNITO,cognito.UserPoolClientIdentityProvider.GOOGLE,cognito.UserPoolClientIdentityProvider.FACEBOOK],
      preventUserExistenceErrors: true,
      refreshTokenValidity: Duration.days(30),
      accessTokenValidity: Duration.days(1),
      idTokenValidity: Duration.days(1),
    });

    // AWS Cognito End //


    //Secrets Manager//
     // 👇 get access to the secret object
     const chatnonymousSecrets = secretsmanager.Secret.fromSecretNameV2(
      this,
      'chatnonymousSecrets-id',
      'chatnonymousSecrets',
    );
    

    //Google and Facebook IDP start //
    const providerAttribute = cognito.ProviderAttribute;
    const userPoolIdentityProviderFacebook = new cognito.UserPoolIdentityProviderFacebook(this, 'FacebookIDP', {
      clientId: chatnonymousSecrets.secretValueFromJson('FacebookAppId').unsafeUnwrap(),
      clientSecret: chatnonymousSecrets.secretValueFromJson('FacebookAppSecret').unsafeUnwrap(),
      userPool: userPool,
      attributeMapping: {
        givenName: providerAttribute.FACEBOOK_FIRST_NAME,
        familyName: providerAttribute.FACEBOOK_LAST_NAME,
        email: providerAttribute.FACEBOOK_EMAIL
      }
    })

    const userPoolIdentityProviderGoggle = new cognito.UserPoolIdentityProviderGoogle(this, 'GoogleIDP', {
      clientId: chatnonymousSecrets.secretValueFromJson('GoogleAppId').unsafeUnwrap(),
      clientSecret: chatnonymousSecrets.secretValueFromJson('GoogleAppSecret').unsafeUnwrap(),
      userPool: userPool,

      attributeMapping: {
        givenName: providerAttribute.GOOGLE_GIVEN_NAME,
        familyName: providerAttribute.GOOGLE_FAMILY_NAME,
        email: providerAttribute.GOOGLE_EMAIL
      }
    })
    //Google and Facebook IDP end // 

    // Create Premium group
    const groupName = 'premium'
    const cfnUserPoolGroup = new cognito.CfnUserPoolGroup(this, 'premiumGroup', {
      userPoolId: userPool.userPoolId,

      // the properties below are optional
      description: 'This is a group for all the premium users.',
      groupName: groupName,
    });

    // Add Lambda function that will add user to the premium group
    const addPremiumUserFunction = new lambda.Function(this, 'addPremiumUserFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'addPremiumUser.handler',
      code: lambda.Code.fromAsset('lambda/premium_endpoint'),
      environment: {
        cognitoUserPoolId: userPool.userPoolId,
        premiumGroupName: groupName
      },
    });

    // Create policy to add user to a group
    const addToCognitoGroupPolicy = new iam.PolicyStatement({
      actions: ['cognito-idp:AdminAddUserToGroup'],
      resources: [userPool.userPoolArn],
    });

    // Attatching the made policy above to the lambda function, giving it access
    addPremiumUserFunction.role?.attachInlinePolicy(
      new iam.Policy(this, 'add-to-group-policy', {
        statements: [addToCognitoGroupPolicy],
      }),
    );

    // Create api gateway with the lambda function as the endpoint
    const api = new apigw.LambdaRestApi(this, 'AddUserToPremiumEndpoint1', {
      handler: addPremiumUserFunction,
      proxy: false,
      defaultCorsPreflightOptions : {
        allowOrigins : [`https://${cfDistro.distributionDomainName}`],
        allowHeaders : ['*'],
        allowMethods: [ 'POST']
      },
    });
  }
}
