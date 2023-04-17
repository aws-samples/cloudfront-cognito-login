all: build deploy

build:
	npm i

	cd lambda/originRequest ; \
	npm i

	cd lambda/viewerRequest ; \
	npm i
	
	cd lambda/premium_endpoint ; \
	npm i

	cd ab3-static-site ; \
    ng build --configuration=production

deploy:
	cdk deploy
