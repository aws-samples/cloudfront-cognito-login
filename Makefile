all: build deploy

build:
	npm i

	cd lambda/originRequest ; \
	npm i

	cd lambda/viewerRequest ; \
	npm i
	
	cd lambda/premium_endpoint ; \
	npm i

	cd static-site ; \
    npm i

	cd static-site ; \
    ng build --configuration=production

deploy:
	cdk deploy
