#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { InfrastructureStack } from '../lib/InfrastructureStack';

const app = new cdk.App();

new InfrastructureStack(app, 'Development-InfrastructureStack',{
    env:{
        account: '<Your AWS Account ID',
        region: '<Your AWS region>'
    }    
});
