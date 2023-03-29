#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { InfrastructureStack } from '../lib/InfrastructureStack';
import 'source-map-support/register';
import { AwsSolutionsChecks } from 'cdk-nag';
import { Aspects } from 'aws-cdk-lib';

const app = new cdk.App();
Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));
new InfrastructureStack(app, 'Development-InfrastructureStack',{
    env:{
        account: '<Your AWS Account ID>',
        region: 'us-east-1'
    }    
});
