all: build deploy

build:
	cd lambda/originRequest ; \
	npm i

	cd src/viewerRequest ; \
	npm i

    cd ab3-static-site ; /
    ng build --configuration=production

deploy:
	cdk deploy
