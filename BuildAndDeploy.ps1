function build {
  cd pre-cloudfront-cognito-stack
  npm i 
  cd ../
  cd cloudfront-cognito-stack
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
  cd ../..
}

function deploy {
  cd pre-cloudfront-cognito-stack
  cdk synth
  cdk bootstrap
  cdk deploy
  cd ../
  cd cloudfront-cognito-stack
  cdk synth
  cdk bootstrap
  cdk deploy
}

function deploySecretsOnly {
  cd pre-cloudfront-cognito-stack
  cdk synth
  cdk bootstrap
  cdk deploy
}

function GoUp(){
  cd ../
}

function deployMainStack {
  cd ../
  cdk synth
  cdk bootstrap
  cdk deploy
}

function awaitUserConfirmation {
  Write-Host "Secrets Manager has been deployed. Please go update the values via AWS console. See documentation for more details."
  Write-Host ""
  while ($input -notmatch "^[Yy]$") {
    # Prompt the user to enter "Y"
    $input = Read-Host "Please enter 'Y' to proceed ONLY AFTER you have updated Secrets Manager: "
  }
}

function all {
  build
  deploySecretsOnly
  awaitUserConfirmation
  GoUp
  deployMainStack
}

if ($args[0] -eq "build") {
  build
} elseif ($args[0] -eq "all") {
  all
} elseif ($args[0] -eq "deploySecretsOnly") {
  deploySecretsOnly
} elseif ($args[0] -eq "deployMainStack") {
  deployMainStack
} else {
  Write-Host "Invalid method name"
}