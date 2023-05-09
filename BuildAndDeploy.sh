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
}

deploy() {
  ls
  cdk deploy
}

build
deploy
