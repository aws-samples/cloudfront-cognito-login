#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { PipelineStack } from '../lib/PipelineStack';

const app = new cdk.App();
new PipelineStack(app, 'PipelineStack',{
    env:{
        account: '272525670255',
        region: 'us-east-1'
    }    
});