# wichat_es6a

## 📑 Index

+ 🧩 Introduction  
+ 🚦 Project Status  
+ 🎮 Try the Application  
+ 👥 Contributors  
+ 📚 Documentation  
+ ⚡ Quick Start Guide  
+ 🚀 Deployment  

## 🧩 Introduction

This repository hosts the *wichat_es6a* project, developed as part of the Software Architecture course for the 2024/2025 academic year. It is a modular application designed to demonstrate key architectural concepts through a chat-based system. The project integrates a React-based web application with multiple Express services, leveraging a MongoDB database and an LLM (Large Language Model) for enhanced functionality. The system is composed of the following components:

+ **User Service**: Manages the creation and storage of user data.  
+ **Auth Service**: Handles user authentication processes.  
+ **LLM Service**: Facilitates communication with an external LLM provider.  
+ **Wikidata Service**: Connects to an external information provider to fetch data used for generating quiz questions.  
+ **History Service**: Manages player game sessions and application statistics.  
+ **Questions Service**: Handles the creation and storage of game questions.  
+ **Gateway Service**: Serves as a public-facing proxy, routing requests to the appropriate internal services.  
+ **Webapp**: A React-based frontend that allows user login, registration, and interaction with the game.

## 🚦 Project Status

+ [![Actions Status](https://github.com/arquisoft/wichat_es6a/workflows/CI%20for%20wichat_es6a/badge.svg)](https://github.com/arquisoft/wichat_es6a/actions)
+ [![Build](https://github.com/arquisoft/wichat_es6a/actions/workflows/build.yml/badge.svg)](https://github.com/arquisoft/wichat_es6a/actions/workflows/build.yml)  
+ [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Arquisoft_wichat_es6a&metric=alert_status)](https://sonarcloud.io/summary/overall?id=Arquisoft_wichat_es6a&branch=master)  
+ [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=Arquisoft_wichat_es6a&metric=coverage)](https://sonarcloud.io/summary/new_code?id=Arquisoft_wichat_es6a)
+ [![Open Issues](https://img.shields.io/github/issues/arquisoft/wichat_es6a)](https://github.com/arquisoft/wichat_es6a/issues)
+ [![Open Pull Requests](https://img.shields.io/github/issues-pr/arquisoft/wichat_es6a)](https://github.com/arquisoft/wichat_es6a/pulls)


## 🎮 Try the Application

You can access and try our application at the following link:

+ [TODO]

## 👥 Contributors

| Contributor | Contact |
| ----------- | ------- |
| Adrián Dumitru | <a href="https://github.com/Adrid64"><img src="https://img.shields.io/badge/uo295652-Adrián Dumitru-red"></a>  |
| Emilio Izquierdo Fernández  | <a href="https://github.com/miloizfer"><img src="https://img.shields.io/badge/uo257691-Emilio Izquierdo-blue"></a>  |
| Manuel Menéndez Valledor  | <a href="https://github.com/Wetrel"><img src="https://img.shields.io/badge/uo277429-Manuel Menéndez-green"></a>  |
| Alejandro Rivada Rodríguez  | <a href="https://github.com/Alejandrorr572"><img src="https://img.shields.io/badge/uo295528-Alejandro Rivada-purple"></a>  |
| Iyán Solís Rodríguez  | <a href="https://github.com/Iyansr97"><img src="https://img.shields.io/badge/uo295103-Iyán Solís-orange"></a>  |

## 📚 Documentation

The full project documentation can be found at the following link:

+ https://arquisoft.github.io/wichat_es6a/

## ⚡ Quick Start Guide

First, clone the project:

```git clone git@github.com:arquisoft/wichat_es6a.git```

### LLM API key configuration

In order to communicate with the LLM integrated in this project, we need to setup an API key. Two integrations are available in this propotipe: gemini and empaphy. The API key provided must match the LLM provider used.

We need to create two .env files. 
- The first one in the webapp directory (for executing the webapp using ```npm start```). The content of this .env file should be as follows:
```
REACT_APP_LLM_API_KEY="YOUR-API-KEY"
```
- The second one located in the root of the project (along the docker-compose.yml). This .env file is used for the docker-compose when launching the app with docker. The content of this .env file should be as follows:
```
LLM_API_KEY="YOUR-API-KEY"
```

Note that these files must NOT be uploaded to the github repository (they are excluded in the .gitignore).

An extra configuration for the LLM to work in the deployed version of the app is to include it as a repository secret (LLM_API_KEY). This secret will be used by GitHub Action when building and deploying the application.


### Launching Using docker
For launching the propotipe using docker compose, just type:
```docker compose --profile dev up --build```

### Component by component start
First, start the database. Either install and run Mongo or run it using docker:

```docker run -d -p 27017:27017 --name=my-mongo mongo:latest```

You can use also services like Mongo Altas for running a Mongo database in the cloud.

Now launch the auth, user and gateway services. Just go to each directory and run `npm install` followed by `npm start`.

Lastly, go to the webapp directory and launch this component with `npm install` followed by `npm start`.

After all the components are launched, the app should be available in localhost in port 3000.

## 🚀 Deployment

For the deployment, we have several options. The first and more flexible is to deploy to a virtual machine using SSH. This will work with any cloud service (or with our own server). Other options include using the container services that all the cloud services provide. This means, deploying our Docker containers directly. Here I am going to use the first approach. I am going to create a virtual machine in a cloud service and after installing docker and docker-compose, deploy our containers there using GitHub Actions and SSH.

### Machine requirements for deployment
The machine for deployment can be created in services like Microsoft Azure or Amazon AWS. These are in general the settings that it must have:

- Linux machine with Ubuntu > 20.04 (the recommended is 24.04).
- Docker installed.
- Open ports for the applications installed (in this case, ports 3000 for the webapp and 8000 for the gateway service).

Once you have the virtual machine created, you can install **docker** using the following instructions:

```ssh
sudo apt update
sudo apt install apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu focal stable"
sudo apt update
sudo apt install docker-ce
sudo usermod -aG docker ${USER}
```

### Continuous delivery (GitHub Actions)
Once we have our machine ready, we could deploy by hand the application, taking our docker-compose file and executing it in the remote machine. In this repository, this process is done automatically using **GitHub Actions**. The idea is to trigger a series of actions when some condition is met in the repository. The precondition to trigger a deployment is going to be: "create a new release". The actions to execute are the following:

![imagen](https://github.com/user-attachments/assets/7ead6571-0f11-4070-8fe8-1bbc2e327ad2)


As you can see, unitary tests of each module and e2e tests are executed before pushing the docker images and deploying them. Using this approach we avoid deploying versions that do not pass the tests.

The deploy action is the following:

```yml
deploy:
    name: Deploy over SSH
    runs-on: ubuntu-latest
    needs: [docker-push-userservice,docker-push-authservice,docker-push-llmservice,docker-push-gatewayservice,docker-push-webapp]
    steps:
    - name: Deploy over SSH
      uses: fifsky/ssh-action@master
      with:
        host: ${{ secrets.DEPLOY_HOST }}
        user: ${{ secrets.DEPLOY_USER }}
        key: ${{ secrets.DEPLOY_KEY }}
        command: |
          wget https://raw.githubusercontent.com/arquisoft/wichat_es6a/master/docker-compose.yml -O docker-compose.yml
          docker compose --profile prod down
          docker compose --profile prod up -d --pull always
```

This action uses three secrets that must be configured in the repository:
- DEPLOY_HOST: IP of the remote machine.
- DEPLOY_USER: user with permission to execute the commands in the remote machine.
- DEPLOY_KEY: key to authenticate the user in the remote machine.

Note that this action logs in the remote machine and downloads the docker-compose file from the repository and launches it. Obviously, previous actions have been executed which have uploaded the docker images to the GitHub Packages repository.



