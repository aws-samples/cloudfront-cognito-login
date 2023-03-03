import * as cdk from 'aws-cdk-lib';
import { InfrastructureStack } from '../lib/InfrastructureStack';

const app = new cdk.App();
new InfrastructureStack(app, 'Development-InfrastructureStack',{
    env:{
        account: '272525670255',
        region: 'us-east-1'
    }
    
});
