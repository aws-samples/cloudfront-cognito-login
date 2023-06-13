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

SecretsOnly() {
  cd pre-cloudfront-cognito-stack
  cdk synth
  cdk bootstrap
  cdk deploy
}
GoUp(){
   cd ../
}
MainStack() {
 
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
all() {
  build
  SecretsOnly
  awaitUserConfirmation
  GoUp
  MainStack

}
if [ "$1" == "build" ]; then
  build
elif [ "$1" == "all" ]; then
  all
elif [ "$1" == "SecretsOnly" ]; then
  SecretsOnly
elif [ "$1" == "MainStack" ]; then
  MainStack
else
  echo "Invalid method name"
fi

