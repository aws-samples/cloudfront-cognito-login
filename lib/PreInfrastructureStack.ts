import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {  SecretValue } from 'aws-cdk-lib';
import { THIRD_PARTY_IDPROVIDER_SECRET_NAME } from './constants';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';




export class PreInfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const secret = new secretsmanager.Secret(this, 'Secret', {
      secretName: 'chatnonymousSecrets',
      secretObjectValue: {
        FacebookAppId: SecretValue.unsafePlainText("<INPUT_HERE>"),
        FacebookAppSecret: SecretValue.unsafePlainText("<INPUT_HERE>"),
        GoogleAppId: SecretValue.unsafePlainText("<INPUT_HERE>"),
        GoogleAppSecret: SecretValue.unsafePlainText("<INPUT_HERE>")
      },
    })

  }
}

