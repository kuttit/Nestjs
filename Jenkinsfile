  pipeline {
    agent {
        label 'slave-165'
    }
    tools {
        jdk 'jdk17'
        nodejs 'Node20.0.0'
    }

    environment {
        SCANNER_HOME = tool 'sonar-scanner'
        DOCKERHUB_USERNAME = "durai54"
        APP_NAME = "torus9x-nest-app"
        BUILD_NUMBER = "${BUILD_NUMBER}"
        IMAGE_NAME = "${DOCKERHUB_USERNAME}/${APP_NAME}"
        DOCKERHUB_CREDENTIALS = "docker-hub"
        GITHUB_CREDENTIALS = credentials('jenkins_PAT')
    }

    stages {
        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }

        stage("Code Checkout") {
            steps {
                git url: 'https://github.com/kuttit/Nestjs.git', branch: 'master'
                credentialsId: "${GITHUB_CREDENTIALS}"
            }
        }
        
        stage("Sonarqube Analysis") {
            steps {
                withSonarQubeEnv('sonar-server') {
                    sh '''$SCANNER_HOME/bin/sonar-scanner \
                        -Dsonar.projectName=Nestapp \
                        -Dsonar.projectKey=Nestapp'''
                }
            }
        }
        
       /*stage("Quality Gate") {
            steps {
                script {
                    waitForQualityGate abortPipeline: false, credentialsId: 'Sonar-token'
                }
            }
        } */ 

        stage('Docker Build Image') {
            steps {
                script {
                    sh "docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} ."
                }
            }
        }

       /* stage("TRIVY SCAN") {
            steps {
                sh "trivy image ${IMAGE_NAME}:${BUILD_NUMBER} > trivyimage.txt"
            }
        } */

        stage('Push Docker Image') {
            steps {
                withCredentials([usernamePassword(credentialsId: DOCKERHUB_CREDENTIALS, usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                    script {
                        sh "docker login -u $DOCKER_USERNAME -p $DOCKER_PASSWORD"
                        sh "docker push ${IMAGE_NAME}:${BUILD_NUMBER}"
                    }
                }
            }
        }

        stage('Remove Old Container') {
            steps {
                script {
                    sh "docker stop torus9x-nest-app-backend-container || true"
                    sh "docker rm torus9x-nest-app-backend-container || true"
                }
            }
        }

        stage('Remove Previous Build Image') {
            steps {
                script {
                    def prevBuildNumber = env.BUILD_NUMBER.toInteger() - 1
                    if (prevBuildNumber > 0) {
                        sh "docker rmi -f ${IMAGE_NAME}:${prevBuildNumber} || true"
                    }
                }
            }
        }

        stage('Run New Container') {
            steps {
                sh "docker run -d --name torus9x-nest-app-backend-container -p 3002:3002 ${IMAGE_NAME}:${BUILD_NUMBER}"
            }
        }
    }
}
