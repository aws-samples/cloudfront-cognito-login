#!/bin/bash

build() {
  npm i

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
  cdk bootstrap
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
build
deploySecretsOnly
awaitUserConfirmation
deployMainStack
