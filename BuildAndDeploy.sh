#!/bin/bash

build() {
  npm i
  cd pre-cloudfront-cognito-stack
  npm i 
  cd ../

  cd lambda/originRequest
  npm i

  cd ../viewerRequest
  npm i
  
  cd ../premium_endpoint
  npm i

  cd ../../static-site
  npm i
  ng build --configuration=production
  cd ..
}

deploy() {
  cd pre-cloudfront-cognito-stack
  cdk synth
  cdk bootstrap
  cdk deploy
  cd ../
  cdk synth
  cdk bootstrap
  cdk deploy
}

deploySecretsOnly() {
  cd pre-cloudfront-cognito-stack
  cdk synth
  cdk bootstrap
  cdk deploy
}
deployMainStack() {
  cd ../
  cdk synth
  cdk bootstrap
  cdk deploy
}

awaitUserConfirmation(){
  echo "Secrets Manager has been deployed. Please go update the values via AWS console. See documentation for more details."
  echo ""
while [[ ! "$input" =~ ^[Yy]$ ]]; do
    # Prompt the user to enter "Y"
    read -p "Please enter 'Y' to proceed ONLY AFTER you have updated Secrets Manager: " input
done

}
buildAndDeploy() {
  build
  deploySecretsOnly
  awaitUserConfirmation
  deployMainStack

}
if [ "$1" == "build" ]; then
  build
elif [ "$1" == "buildAndDeploy" ]; then
  buildAndDeploy
elif [ "$1" == "deploySecretsOnly" ]; then
  deploySecretsOnly
elif [ "$1" == "deployMainStack" ]; then
  deployMainStack
else
  echo "Invalid method name"
fi

