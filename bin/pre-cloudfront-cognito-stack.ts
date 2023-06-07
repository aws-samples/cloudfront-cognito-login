#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { PreInfrastructureStack } from '../lib/PreInfrastructureStack';

const app = new cdk.App();

new PreInfrastructureStack(app, 'Pre-Development-InfrastructureStack',{
    env:{
        account: '381371834000',
        region: 'us-east-1'
    }    
});

