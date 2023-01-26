#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { SampleCloudfrontCognitoStackStack } from '../lib/sample-cloudfront-cognito-stack-stack';

const app = new cdk.App();
new SampleCloudfrontCognitoStackStack(app, 'SampleCloudfrontCognitoStackStack');
