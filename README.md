# Cloudfront Cognito Login

This pattern utilizes Cognito, Cloudfront, Lambda@Edge, WAF and S3 to implement a HostedUI login page for your web page. Users can login/sign-up using email, Google or Facebook and, upon login, are redirected to a website with a JWT token passed. This pattern also includes a Lambda based API behind API Gateway that can be used to add users to a premium user group. The entire stack can be deployed using CDK.

This is a typescript CDK application that creates:
* Amazon S3 bucket for static website hosting. Hosted behind Cloudfront
* Cognito Hosted UI and user pools for user data storage and authentication
* AWS Lambda function behind Amazon API Gateway for adding users to a premium user group
* AWS Lambda@Edge functions: OriginRequest and ViewerRequest to redirect users to login page if they are not already authenticated.

## Setup
Prereqs:
* Angular CLI https://angular.io/cli
* npm https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
* CDK CLI https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html

## Target Technology Stack and File Locations
### Infrastructure (Typescript)
Any infrastructure changes occur within the `lib/InfrastructureStack.ts` file. This creates:
* Hosted UI login page
* Cloudfront
* WAF and Shield

### Lambda (ViewerRequest, OriginRequest and Premium_Lambda)
All lambda code functions out of the box and can be found within `lambda/` directory

### Example Static Website in S3 behind Cloudfront
This pattern includes an example Angular website just to highlight how an s3 website would be hosted behind AWS Cloudfront and to show how AWS Cognito Hosted UI can redirect to any domain of your choosing.

## How to Deploy

There is a Makefile that will build the AWS Lambdas and static website and deploy to your AWS environment.
* `make build` – builds lambdas `npm i` and builds static website code `ng build --configuration=production`
* `make deploy` – cdk deploy
* `make` – builds the entire stack and deploys to AWS.

### First deployment
The first time you deploy your code, you will need to:
* `cdk synth`
* `cdk bootstrap`
* `Make`

### All following deployments
* `make`

## How to Deploy and Test

### Deploy the stack
There is a provided Makefile for building the static website and the lambdas. To build and deploy, simply run `make`. This make command will run `npm i` in all of the lambda directories to ensure their dependencies are present for deploy. It will also build the static site, built in angular, by running `ng build --configuration=production`. After building, the makefile will run cdk deploy to push your stack into AWS.

All future deployments can be run by simply running: `make`

### Update Secrets
Once your stack is deployed, navigate to Cognito clients and update secrets manager with the ClientID and ClientSecret. Within the same UI, under User Pools you can find the Facebook and Google client credentials.

You’ll see in our repo, we’re referencing the Secret “chatnonymousSecrets“
Here is a comprenehsive list of secret keys and where their values can be found:

* ClientID - Amazon Cognito → User pools → chatnonymous-user-pool → App client: userpoolClient<id-from-cdk>
* ClientSecret - Amazon Cognito → User pools → chatnonymous-user-pool → App client: userpoolClient<id-from-cdk>
* DomainName - chatnonymous
* UserPoolID - Amazon Cognito → User pools
* FacebookAppId 
* FacebookAppSecret
* GoogleAppId
* GoogleAppSecret

All Facebook / Google credentials can be found at:
* Amazon Cognito → User pools → chatnonymous-user-pool → App client: userpoolClient<id-from-cdk> → Hosted UI → Edit

Navigate to Secrets Manager and select the secret `chatnonymousSecret`. Populate the above values within that secret.

### View HostedUI
Navigate to Cloudfront and grab the domain name listed next to your distribution. You should be redirected to a URL like: `https://chatnonymous.auth.us-east-1.amazoncognito.com/login?response_type=code&client_id…` This is your hosted_UI and you can now begin signing up, logging in and checking JWT tokens!

### Add a Premium user
Once you have a user added to your User Pool, you can add that user to a premium user group via the premium lambda. To test this, navigate to API Gateway and click on the api titled `AddUsertoPremiumUserGroup` and you can create a test event. This api takes just 1 parameter, username. 
```
{
    "username" : "email@email.com"
}
```

## How to redirect to your own website
This solution includes an example angular static website, hosted in s3 behind cloudfront. The website code is stored under `static-site`. If you want to use your own code, you need to do a few things:
* Within Makefile, edit the website path and any build commands needed.

* Within `lib/json_schema_validator-stack.ts`, you will need to edit the `s3deploy.BucketDeployment` source to be where your website compiled code lives. There are comments within this file that specify how to do this.
## Useful commands for local development

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
