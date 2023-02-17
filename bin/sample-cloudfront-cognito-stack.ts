#!/usr/bin/env node
// import * as cdk from 'aws-cdk-lib';
// import { PipelineStack } from '../lib/PipelineStack';

// const app = new cdk.App();
// new PipelineStack(app, 'PipelineStack',{
//     env:{
//         account: '272525670255',
//         region: 'us-east-1'
//     }
    
// });

// You can use this to deploy your code without needing to merge to master
import * as cdk from 'aws-cdk-lib';
import { InfrastructureStack } from '../lib/InfrastructureStack';

const app = new cdk.App();
new InfrastructureStack(app, 'Development-InfrastructureStack',{
    env:{
        account: '272525670255',
        region: 'us-east-1'
    }
    
});
