#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { PreInfrastructureStack } from '../lib/pre-cloudfront-cognito-stack';

const app = new cdk.App();

new PreInfrastructureStack(app, 'Pre-Development-InfrastructureStack',{
  
});

