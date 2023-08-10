import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Duration, SecretValue } from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { BlockPublicAccess, Bucket, BucketAccessControl, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { OriginAccessIdentity, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { aws_wafv2 as wafv2 } from 'aws-cdk-lib';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { THIRD_PARTY_IDPROVIDER_SECRET_NAME, DOMAIN_PREFIX } from '../bin/constants';


export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda@edge handlers start//
    const lambdaRole = new iam.Role(this, 'EdgeFunctionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });
  
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: [`arn:aws:secretsmanager:*:*:secret:cognitoClientSecrets*`],
      })
    );
    lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));
    
    const viewerRequest = new cloudfront.experimental.EdgeFunction(this, 'viewerRequest', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'viewerRequest.handler',
      code: lambda.Code.fromAsset('lambda/viewerRequest'),
      role: lambdaRole
    });
    const originRequest = new cloudfront.experimental.EdgeFunction(this, 'originRequest', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'originRequest.handler',
      code: lambda.Code.fromAsset('lambda/originRequest'),
      role: lambdaRole
    });

    
    // Lambda@edge handlers end//


    // ------------------- Static chat app site cdk start -------------------
    const staticSiteBucket = new Bucket(this, 'staticSiteBucket', {
      versioned: true,
      encryption: BucketEncryption.S3_MANAGED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL
    });

    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('static-site/dist/static-site')],
      destinationBucket: staticSiteBucket,
    });


    const oia = new OriginAccessIdentity(this, 'OIA', {
      comment: "Created by CDK for static site"
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

    const cfDistro = new cloudfront.Distribution(this, 'example', {
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
      userPoolName: 'example-user-pool',
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
        minLength: 8, // Minimum password length
        requireUppercase: true, // Require at least one uppercase letter
        requireLowercase: true, // Require at least one lowercase letter
        requireDigits: true, // Require at least one digit
        requireSymbols: true, // Require at least one special character
      },
      advancedSecurityMode: cognito.AdvancedSecurityMode.ENFORCED,
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const userPoolDomain = userPool.addDomain('hostedDomain', {
      cognitoDomain: {
        domainPrefix: DOMAIN_PREFIX,
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
      preventUserExistenceErrors: true,
      refreshTokenValidity: Duration.days(30),
      accessTokenValidity: Duration.days(1),
      idTokenValidity: Duration.days(1),

    });

    // AWS Cognito End //

    const secret = new secretsmanager.Secret(this, 'Secret', {
      secretName: "cognitoClientSecrets",
      secretObjectValue: {
        ClientID: SecretValue.unsafePlainText(userPoolClient.userPoolClientId),
        ClientSecret: userPoolClient.userPoolClientSecret,
        DomainName: SecretValue.unsafePlainText(userPoolDomain.domainName),
        UserPoolID: SecretValue.unsafePlainText(userPool.userPoolId),
        DistributionDomainName: SecretValue.unsafePlainText(cfDistro.distributionDomainName)
      },
    })

    const thirdPardyIdsSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      THIRD_PARTY_IDPROVIDER_SECRET_NAME,
      THIRD_PARTY_IDPROVIDER_SECRET_NAME,
    );

    //Google and Facebook IDP start //
    const providerAttribute = cognito.ProviderAttribute;
    const userPoolIdentityProviderFacebook = new cognito.UserPoolIdentityProviderFacebook(this, 'FacebookIDP', {
      clientId: thirdPardyIdsSecret.secretValueFromJson('FacebookAppId').unsafeUnwrap(),
      clientSecret: thirdPardyIdsSecret.secretValueFromJson('FacebookAppSecret').unsafeUnwrap(),
      userPool: userPool,
      attributeMapping: {
        givenName: providerAttribute.FACEBOOK_FIRST_NAME,
        familyName: providerAttribute.FACEBOOK_LAST_NAME,
        email: providerAttribute.FACEBOOK_EMAIL
      }
    })

    const userPoolIdentityProviderGoggle = new cognito.UserPoolIdentityProviderGoogle(this, 'GoogleIDP', {
      clientId: thirdPardyIdsSecret.secretValueFromJson('GoogleAppId').unsafeUnwrap(),
      clientSecret: thirdPardyIdsSecret.secretValueFromJson('GoogleAppSecret').unsafeUnwrap(),
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

    // Create a log group for access logs
    const accessLogGroup = new logs.LogGroup(this, 'MyAccessLogGroup', {
      retention: logs.RetentionDays.ONE_MONTH, // Set the retention period for logs (adjust as needed)
    });
    
    // Create api gateway with the lambda function as the endpoint
    const api = new apigw.LambdaRestApi(this, 'AddUserToPremiumEndpoint1', {
      handler: addPremiumUserFunction,
      proxy: false,
      defaultCorsPreflightOptions : {
        allowOrigins : [`https://${cfDistro.distributionDomainName}`],
        allowHeaders : ['*'],
        allowMethods: [ 'POST']
      },
      deployOptions: {
        accessLogDestination: new apigw.LogGroupLogDestination(accessLogGroup), 
        accessLogFormat: apigw.AccessLogFormat.jsonWithStandardFields(),
        loggingLevel: apigw.MethodLoggingLevel.INFO, // Adjust the logging level as needed
        dataTraceEnabled: true
      }
    });
  }
}

