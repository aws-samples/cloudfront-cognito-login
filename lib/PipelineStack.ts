import * as cdk from "aws-cdk-lib";
import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import * as pipelines from "aws-cdk-lib/pipelines";
import * as codecommit from "aws-cdk-lib/aws-codecommit";

import { Construct } from 'constructs';
import { InfrastructureStack } from './InfrastructureStack';

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

     const repo = codecommit.Repository.fromRepositoryArn(
      this,
      "Repository",
      `arn:aws:codecommit:us-east-1:272525670255:ab3-login`
    );
    
    const pipeline = new pipelines.CodePipeline(this, "AB3Pipeline", {
      pipelineName: "AB3Pipeline",
      synth: new pipelines.CodeBuildStep("CodeBuildSynth", {
        input: pipelines.CodePipelineSource.codeCommit(repo, "main"),
        installCommands: [
          "npm install -g aws-cdk",
          "npm install",
        ],
//         TODO add following cmds for angular site building
//          cd ab3-static-site
//          npm install -g @angular/cli
//          npm i
//          ng build --configuration=production 
//          cd ..
        commands: ["cdk synth"],
        primaryOutputDirectory: "cdk.out",
        buildEnvironment: {
          computeType: codebuild.ComputeType.SMALL,
        },
        timeout: cdk.Duration.minutes(90),
      }),
    });

    const deploy = new PipelineStage(this, "Development");
    pipeline.addStage(deploy);
    
  }
  
}

class PipelineStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    new InfrastructureStack (this, "InfrastructureStack",{
      env:{
        region: 'us-east-1'
      }
    });
  }
}